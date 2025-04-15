import type { State, StateCreator, WasmStoreHandle } from "./types";
import { StoreHandle, BatchUpdate, start } from "@waztate/wasm";

let storeHandleInstance: WasmStoreHandle | null = null;
let initialized = false;

export interface Store<T extends State> {
  getState: () => T;
  setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
  subscribe: (listener: (state: T) => void) => () => void;
  batch: (updates: Array<{key?: string, partial: Partial<T> | ((state: T) => Partial<T>)}>) => void;
}

function getStoreHandle(): WasmStoreHandle {
  if (!initialized) {
    start();
    initialized = true;
  }
  if (!storeHandleInstance) {
    storeHandleInstance = new StoreHandle();
  }
  if (!storeHandleInstance) {
    throw new Error("Failed to initialize WASM store handle");
  }
  return storeHandleInstance;
}

export function createStore<T extends State>(
  initializer: StateCreator<T>,
  key: string
): Store<T> {
  const storeHandle = getStoreHandle();

  const initState = initializer();
  storeHandle.set(key, initState, false);

  const setState: Store<T>["setState"] = (partial) => {
    const isFunction = typeof partial === "function";
    storeHandle.set(key, partial as any, isFunction);
  };

  const getState: Store<T>["getState"] = () => {
    return storeHandle.get(key) as T;
  };

  const subscribe: Store<T>["subscribe"] = (listener) => {
    const id = storeHandle.subscribe(key, listener);
    return () => {
      storeHandle.unsubscribe(id);
    };
  };

  const batch: Store<T>["batch"] = (updates) => {
    const batchUpdate = new BatchUpdate();
    
    for (const update of updates) {
      const updateKey = update.key || key;
      const partial = update.partial;
      
      if (typeof partial === "function") {
        const currentState = storeHandle.get(updateKey);
        const nextState = (partial as any)(currentState);
        batchUpdate.add(updateKey, nextState);
      } else {
        const currentState = storeHandle.get(updateKey);
        batchUpdate.add(updateKey, { ...currentState, ...partial });
      }
    }
    
    storeHandle.batch_set(batchUpdate);
  };

  return { setState, getState, subscribe, batch };
}
