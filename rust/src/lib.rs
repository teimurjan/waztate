use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock, Mutex};
use wasm_bindgen::prelude::*;
use js_sys::Function;

// Initialize the panic hook for better error messages
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

// Separate locks for different parts of the store
struct Store {
    // Use RwLock for state to allow concurrent reads
    state: RwLock<HashMap<String, JsValue>>,
    // Subscription management needs mutex for exclusive access
    subscribers: RwLock<HashMap<String, Vec<usize>>>,
    callback_map: RwLock<HashMap<usize, Function>>,
    next_id: Mutex<usize>,
}

impl Store {
    fn new() -> Self {
        Self {
            state: RwLock::new(HashMap::new()),
            subscribers: RwLock::new(HashMap::new()),
            callback_map: RwLock::new(HashMap::new()),
            next_id: Mutex::new(0),
        }
    }

    fn get(&self, key: &str) -> Option<JsValue> {
        let state = self.state.read().unwrap();
        state.get(key).cloned()
    }

    fn subscribe(&self, key: &str, callback: Function) -> usize {
        // Generate ID with minimal lock time
        let id = {
            let mut next_id = self.next_id.lock().unwrap();
            let id = *next_id;
            *next_id += 1;
            id
        };
        
        // Store callback
        {
            let mut callback_map = self.callback_map.write().unwrap();
            callback_map.insert(id, callback);
        }
        
        // Add to subscribers
        {
            let mut subscribers = self.subscribers.write().unwrap();
            subscribers
                .entry(key.to_string())
                .or_insert_with(Vec::new)
                .push(id);
        }
        
        id
    }

    fn unsubscribe(&self, id: usize) -> bool {
        // Remove callback
        let removed = {
            let mut callback_map = self.callback_map.write().unwrap();
            callback_map.remove(&id).is_some()
        };
        
        if removed {
            // Update subscribers
            let mut subscribers = self.subscribers.write().unwrap();
            for subs in subscribers.values_mut() {
                subs.retain(|&s_id| s_id != id);
            }
            
            // Remove empty subscriber lists
            subscribers.retain(|_, subs| !subs.is_empty());
        }
        
        removed
    }

    // New method for batch updates
    fn batch_update(&self, updates: Vec<(String, JsValue)>) -> Vec<(Function, JsValue)> {
        let mut callbacks_to_run = Vec::new();
        let mut affected_keys = HashSet::new();
        
        // First update all state values
        {
            let mut state = self.state.write().unwrap();
            for (key, value) in updates {
                let changed = match state.get(&key) {
                    Some(old_value) => !js_sys::Object::is(old_value, &value),
                    None => true,
                };
                
                if changed {
                    state.insert(key.clone(), value);
                    affected_keys.insert(key);
                }
            }
        }
        
        // Then collect callbacks
        if !affected_keys.is_empty() {
            let subscribers = self.subscribers.read().unwrap();
            let callback_map = self.callback_map.read().unwrap();
            let state = self.state.read().unwrap();
            
            for key in affected_keys {
                if let Some(subs) = subscribers.get(&key) {
                    if let Some(state_value) = state.get(&key) {
                        for &id in subs.iter() {
                            if let Some(callback) = callback_map.get(&id) {
                                callbacks_to_run.push((callback.clone(), state_value.clone()));
                            }
                        }
                    }
                }
            }
        }
        
        callbacks_to_run
    }
}

// Global store instance
thread_local! {
    static STORE: Arc<Store> = Arc::new(Store::new());
}

#[wasm_bindgen]
pub struct StoreHandle {
    store: Arc<Store>,
}

#[wasm_bindgen]
pub struct BatchUpdate {
    updates: Vec<(String, JsValue)>,
}

#[wasm_bindgen]
impl BatchUpdate {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            updates: Vec::new(),
        }
    }
    
    #[wasm_bindgen]
    pub fn add(&mut self, key: &str, value: &JsValue) {
        self.updates.push((key.to_string(), value.clone()));
    }
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
        self.store.get(key).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen]
    pub fn set(&self, key: &str, updater: &JsValue, is_function: bool) -> bool {
        let next_state = if is_function {
            // Calculate next state with minimal locking
            let current_state = self.store.get(key).unwrap_or(JsValue::NULL);
            
            let updater_fn: &Function = updater.dyn_ref().unwrap();
            let this = JsValue::null();
            updater_fn.call1(&this, &current_state).unwrap_or(current_state)
        } else {
            updater.clone()
        };

        // Use batch update with a single entry
        let updates = vec![(key.to_string(), next_state)];
        let callbacks = self.store.batch_update(updates);
        
        let has_changes = !callbacks.is_empty();
        
        // Execute callbacks
        for (callback, state) in callbacks {
            let this = JsValue::null();
            let _ = callback.call1(&this, &state);
        }
        
        has_changes
    }
    
    #[wasm_bindgen]
    pub fn batch_set(&self, batch: &BatchUpdate) -> bool {
        let callbacks = self.store.batch_update(batch.updates.clone());
        let has_changes = !callbacks.is_empty();
        
        // Execute callbacks outside of locks
        for (callback, state) in callbacks {
            let this = JsValue::null();
            let _ = callback.call1(&this, &state);
        }
        
        has_changes
    }

    #[wasm_bindgen]
    pub fn subscribe(&self, key: &str, callback: Function) -> usize {
        self.store.subscribe(key, callback)
    }

    #[wasm_bindgen]
    pub fn unsubscribe(&self, id: usize) -> bool {
        self.store.unsubscribe(id)
    }
}
