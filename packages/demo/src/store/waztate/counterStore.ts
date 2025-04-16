import { createStore } from "@waztate/lib";

interface CounterState {
  value: number;
}

const initialState: CounterState = {
  value: 0,
};

const counterStore = createStore<CounterState>(() => initialState, "counter");

export { counterStore };

export const actions = {
  increment: () =>
    counterStore.setState((state) => ({ value: state.value + 1 })),

  reset: () => counterStore.setState((state) => ({ value: 0 })),
};
