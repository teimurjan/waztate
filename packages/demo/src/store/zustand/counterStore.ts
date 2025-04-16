import { create } from "zustand";

interface CounterState {
  value: number;
  increment: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 })),
  reset: () => set({ value: 0 }),
}));
