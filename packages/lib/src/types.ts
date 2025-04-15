export interface WasmStoreHandle {
  get: (key: string) => any;
  set: (key: string, updater: any, isFunction: boolean) => boolean;
  subscribe: (key: string, callback: () => void) => number;
  unsubscribe: (id: number) => boolean;
}

export type Value =
  | undefined
  | null
  | boolean
  | number
  | string
  | Value[]
  | { [K in PropertyKey]?: Value };

export type State = { [K in PropertyKey]?: Value };

export type Store<T extends State> = StoreApi<T>;

export interface StoreApi<T extends State> {
  getState: () => T;
  setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
}

export type StateCreator<T extends State> = () => T;
