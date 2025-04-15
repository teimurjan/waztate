use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use wasm_bindgen::prelude::*;
use js_sys::Function;

// Initialize the panic hook for better error messages
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

struct Store {
    state: HashMap<String, JsValue>,
    subscribers: HashMap<String, Vec<usize>>,
    callback_map: HashMap<usize, Function>,
    next_id: usize,
}

impl Store {
    fn new() -> Self {
        Self {
            state: HashMap::new(),
            subscribers: HashMap::new(),
            callback_map: HashMap::new(),
            next_id: 0,
        }
    }

    fn get(&self, key: &str) -> Option<&JsValue> {
        self.state.get(key)
    }

    fn subscribe(&mut self, key: &str, callback: Function) -> usize {
        let id = self.next_id;
        self.next_id += 1;
        
        self.callback_map.insert(id, callback);
        
        self.subscribers
            .entry(key.to_string())
            .or_insert_with(Vec::new)
            .push(id);
        
        id
    }

    fn unsubscribe(&mut self, id: usize) -> bool {
        let removed = self.callback_map.remove(&id).is_some();
        
        for subs in self.subscribers.values_mut() {
            subs.retain(|&s_id| s_id != id);
        }
        
        self.subscribers.retain(|_, subs| !subs.is_empty());
        
        removed
    }
}

// Global store instance
thread_local! {
    static STORE: Arc<Mutex<Store>> = Arc::new(Mutex::new(Store::new()));
}

#[wasm_bindgen]
pub struct StoreHandle {
    store: Arc<Mutex<Store>>,
}

#[wasm_bindgen]
impl StoreHandle {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        STORE.with(|store| Self {
            store: store.clone(),
        })
    }

    #[wasm_bindgen]
    pub fn get(&self, key: &str) -> JsValue {
        let store = self.store.lock().unwrap();
        store.get(key).cloned().unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn set(&self, key: &str, updater: &JsValue, is_function: bool) -> bool {
        // First, calculate the next state and collect callbacks while holding the lock
        let callbacks_to_run = {
            let mut store = self.store.lock().unwrap();
            
            let next_state = if is_function {
                let updater_fn: &Function = updater.dyn_ref().unwrap();
                let this = JsValue::null();
                let current_state = store.get(key).cloned().unwrap_or(JsValue::NULL);
                updater_fn.call1(&this, &current_state).unwrap_or(current_state)
            } else {
                updater.clone()
            };

            let changed = match store.state.get(key) {
                Some(old_value) => !js_sys::Object::is(old_value, &next_state),
                None => true,
            };

            let mut callbacks = Vec::new();
            if changed {
                store.state.insert(key.to_string(), next_state);
                if let Some(subs) = store.subscribers.get(key) {
                    for &id in subs.iter() {
                        if let Some(callback) = store.callback_map.get(&id) {
                            callbacks.push(callback.clone());
                        }
                    }
                }
            }
            callbacks
        }; // Lock is released here

        let has_changes = !callbacks_to_run.is_empty();

        // Execute callbacks after the lock is released
        for callback in callbacks_to_run {
            let this = JsValue::null();
            let _ = callback.call0(&this);
        }

        has_changes
    }

    #[wasm_bindgen]
    pub fn subscribe(&self, key: &str, callback: Function) -> usize {
        let mut store = self.store.lock().unwrap();
        store.subscribe(key, callback)
    }

    #[wasm_bindgen]
    pub fn unsubscribe(&self, id: usize) -> bool {
        let mut store = self.store.lock().unwrap();
        store.unsubscribe(id)
    }
}
