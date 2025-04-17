import { useSyncExternalStore, useRef, useCallback } from "react";
import type { Store, State } from "@waztate/types";

export function useStore<T extends State>(store: Store<T>): T;
export function useStore<T extends State, U>(
  store: Store<T>,
  selector: (state: T) => U
): U;
export function useStore<T extends State, U>(
  store: Store<T>,
  selector?: (state: T) => U
): T | U {
  const lastValueRef = useRef<T | U>();
  const lastStateRef = useRef<T>();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const getSnapshot = useCallback(() => {
    const currentState = store.getState();

    if (selectorRef.current) {
      if (currentState !== lastStateRef.current) {
        lastStateRef.current = currentState;
        lastValueRef.current = selectorRef.current(currentState);
      }
      return lastValueRef.current as U;
    } else {
      // Cache the current state when not using a selector too
      if (currentState !== lastStateRef.current) {
        lastStateRef.current = currentState;
        lastValueRef.current = currentState;
      }
      return lastValueRef.current as T;
    }
  }, [store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export function useStoreValue<T extends State>(store: Store<T>): T {
  return useStore(store);
}

export function useStoreSelector<T extends State, U>(
  store: Store<T>,
  selector: (state: T) => U
): U {
  return useStore(store, selector);
}
