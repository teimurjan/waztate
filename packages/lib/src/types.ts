export type State = Record<string, any>;

export type StateCreator<T extends State> = () => T;

export interface BatchUpdate {
  add(key: string, value: any): void;
}

export interface WasmStoreHandle {
  get(key: string): any;
  set(key: string, updater: any, isFunction: boolean): boolean;
  subscribe(key: string, callback: (state: any) => void): number;
  unsubscribe(id: number): boolean;
  batch_set(batch: BatchUpdate): boolean;
}

export type Value =
  | undefined
  | null
  | boolean
  | number
  | string
  | Value[]
  | { [K in PropertyKey]?: Value };

export type Store<T extends State> = StoreApi<T>;

export interface StoreApi<T extends State> {
  getState: () => T;
  setState: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
  subscribe: (listener: (state: T) => void) => () => void;
  batch: (updates: Array<{key?: string, partial: Partial<T> | ((state: T) => Partial<T>)}>) => void;
}
