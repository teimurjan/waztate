import type { State, StateCreator, WasmStoreHandle } from "./types";
import { StoreHandle, start } from "@waztate/wasm";

let storeHandleInstance: WasmStoreHandle | null = null;
let initialized = false;

export interface Store<T extends State> {
  getState: () => T;
  setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
  subscribe: (listener: (state: T, previousState: T) => void) => () => void;
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
    let previousState = getState();
    const callback = () => {
      const currentState = getState();
      listener(currentState, previousState);
      previousState = currentState;
    };

    const id = storeHandle.subscribe(key, callback);
    return () => {
      storeHandle.unsubscribe(id);
    };
  };

  return { setState, getState, subscribe };
}
