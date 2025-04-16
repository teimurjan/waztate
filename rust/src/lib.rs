use std::collections::{HashMap, HashSet};
use std::cell::{RefCell, Cell};
use wasm_bindgen::prelude::*;
use js_sys::Function;

// Use `wee_alloc` as the global allocator to reduce code size
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Initialize the panic hook for better error messages
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

// Single-threaded store implementation
struct Store {
    state: RefCell<HashMap<String, JsValue>>,
    subscribers: RefCell<HashMap<String, Vec<usize>>>,
    callback_map: RefCell<HashMap<usize, Function>>,
    next_id: Cell<usize>,
}

impl Store {
    fn new() -> Self {
        Self {
            state: RefCell::new(HashMap::new()),
            subscribers: RefCell::new(HashMap::new()),
            callback_map: RefCell::new(HashMap::new()),
            next_id: Cell::new(0),
        }
    }

    fn get(&self, key: &str) -> Option<JsValue> {
        let state = self.state.borrow();
        state.get(key).cloned()
    }

    fn subscribe(&self, key: &str, callback: Function) -> usize {
        let id = self.next_id.get();
        self.next_id.set(id + 1);
        
        {
            let mut callback_map = self.callback_map.borrow_mut();
            callback_map.insert(id, callback);
        }
        
        {
            let mut subscribers = self.subscribers.borrow_mut();
            subscribers
                .entry(key.to_string())
                .or_insert_with(Vec::new)
                .push(id);
        }
        
        id
    }

    fn unsubscribe(&self, id: usize) -> bool {
        let removed = {
            let mut callback_map = self.callback_map.borrow_mut();
            callback_map.remove(&id).is_some()
        };
        
        if removed {
            let mut subscribers = self.subscribers.borrow_mut();
            for subs in subscribers.values_mut() {
                subs.retain(|&s_id| s_id != id);
            }
            
            subscribers.retain(|_, subs| !subs.is_empty());
        }
        
        removed
    }

    fn set(&self, key: String, value: JsValue) -> Vec<(Function, JsValue)> {
        let mut callbacks_to_run = Vec::new();
        let mut affected_keys = HashSet::new();
        
        {
            let mut state = self.state.borrow_mut();
            let changed = match state.get(&key) {
                Some(old_value) => !js_sys::Object::is(old_value, &value),
                None => true,
            };
            
            if changed {
                // Store the key in affected_keys before moving it into state
                affected_keys.insert(key.clone());
                state.insert(key, value);
            }
        }
        
        // Second pass: collect callbacks to run without cloning values multiple times
        if !affected_keys.is_empty() {
            let subscribers = self.subscribers.borrow();
            let callback_map = self.callback_map.borrow();
            let state = self.state.borrow();
            
            // Create a map of callback id -> key to deduplicate callbacks
            let mut callback_keys: HashMap<usize, String> = HashMap::new();
            
            // First, collect which callbacks need to be run for which keys
            for key in affected_keys {
                if let Some(subs) = subscribers.get(&key) {
                    for &id in subs.iter() {
                        callback_keys.insert(id, key.clone());
                    }
                }
            }
            
            // Then, build the callbacks_to_run vec with a single clone per value
            for (id, key) in callback_keys {
                if let (Some(callback), Some(state_value)) = (callback_map.get(&id), state.get(&key)) {
                    callbacks_to_run.push((callback.clone(), state_value.clone()));
                }
            }
        }
        
        callbacks_to_run
    }

    fn batch_set(&self, entries: &js_sys::Array) -> Vec<(Function, JsValue)> {
        let mut callbacks_to_run = Vec::new();
        let mut affected_keys = HashSet::new();
        
        // First pass: update all state values
        {
            let mut state = self.state.borrow_mut();
            
            for i in 0..entries.length() {
                let entry = entries.get(i);
                let entry_obj = js_sys::Array::from(&entry);
                
                if entry_obj.length() >= 3 {
                    let key = entry_obj.get(0).as_string().unwrap_or_default();
                    let value = entry_obj.get(1);
                    let is_function = entry_obj.get(2).as_bool().unwrap_or(false);
                    
                    let next_state = if is_function {
                        // Calculate next state using the function
                        let current_state = state.get(&key).cloned().unwrap_or(JsValue::NULL);
                        
                        let updater_fn: &Function = value.dyn_ref().unwrap();
                        let this = JsValue::null();
                        updater_fn.call1(&this, &current_state).unwrap_or(current_state)
                    } else {
                        value
                    };
                    
                    let changed = match state.get(&key) {
                        Some(old_value) => !js_sys::Object::is(old_value, &next_state),
                        None => true,
                    };
                    
                    if changed {
                        affected_keys.insert(key.clone());
                        state.insert(key, next_state);
                    }
                }
            }
        }
        
        // Second pass: collect callbacks to run without cloning values multiple times
        if !affected_keys.is_empty() {
            let subscribers = self.subscribers.borrow();
            let callback_map = self.callback_map.borrow();
            let state = self.state.borrow();
            
            // Create a map of callback id -> key to deduplicate callbacks
            let mut callback_keys: HashMap<usize, String> = HashMap::new();
            
            // First, collect which callbacks need to be run for which keys
            for key in affected_keys {
                if let Some(subs) = subscribers.get(&key) {
                    for &id in subs.iter() {
                        callback_keys.insert(id, key.clone());
                    }
                }
            }
            
            // Then, build the callbacks_to_run vec with a single clone per value
            for (id, key) in callback_keys {
                if let (Some(callback), Some(state_value)) = (callback_map.get(&id), state.get(&key)) {
                    callbacks_to_run.push((callback.clone(), state_value.clone()));
                }
            }
        }
        
        callbacks_to_run
    }
}

thread_local! {
    static STORE: Store = Store::new();
}

#[wasm_bindgen]
pub struct StoreHandle {
    // No field needed as we use thread_local
}

#[wasm_bindgen]
impl StoreHandle {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {}
    }

    #[wasm_bindgen]
    pub fn get(&self, key: &str) -> JsValue {
        STORE.with(|store| {
            store.get(key).unwrap_or(JsValue::NULL)
        })
    }

    #[wasm_bindgen]
    pub fn set(&self, key: &str, updater: &JsValue, is_function: bool) -> bool {
        STORE.with(|store| {
            let next_state = if is_function {
                // Calculate next state
                let current_state = store.get(key).unwrap_or(JsValue::NULL);
                
                let updater_fn: &Function = updater.dyn_ref().unwrap();
                let this = JsValue::null();
                updater_fn.call1(&this, &current_state).unwrap_or(current_state)
            } else {
                updater.clone()
            };

            let callbacks = store.set(key.to_string(), next_state);
            
            let has_changes = !callbacks.is_empty();
            
            for (callback, state) in callbacks {
                let this = JsValue::null();
                let _ = callback.call1(&this, &state);
            }
            
            has_changes
        })
    }

    #[wasm_bindgen]
    pub fn batch_set(&self, entries: &js_sys::Array) -> bool {
        STORE.with(|store| {
            let callbacks = store.batch_set(entries);
            
            let has_changes = !callbacks.is_empty();
            
            for (callback, state) in callbacks {
                let this = JsValue::null();
                let _ = callback.call1(&this, &state);
            }
            
            has_changes
        })
    }

    #[wasm_bindgen]
    pub fn subscribe(&self, key: &str, callback: Function) -> usize {
        STORE.with(|store| store.subscribe(key, callback))
    }

    #[wasm_bindgen]
    pub fn unsubscribe(&self, id: usize) -> bool {
        STORE.with(|store| store.unsubscribe(id))
    }
}
