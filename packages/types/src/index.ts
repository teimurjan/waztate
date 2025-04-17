export type State = Record<string, any>;

export type StateCreator<T extends State> = () => T;

export type Value =
  | undefined
  | null
  | boolean
  | number
  | string
  | Value[]
  | { [K in PropertyKey]?: Value };

export type Updater<T extends State> = T | Partial<T> | ((state: T) => T | Partial<T>);

export interface StoreApi<T extends State> {
  getState: () => T;
  setState: (partial: Updater<T>) => boolean;
  subscribe: (listener: (state: T) => void) => () => void;
}

export type Store<T extends State> = StoreApi<T>; 