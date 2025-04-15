import { create } from "zustand";
import { Filter, TodoState } from "@/store/shared/types";
import { initialState } from "../shared";

export const useTodoStore = create<
  TodoState & {
    setFilter: (filter: Filter) => void;
    addTodo: (text: string) => void;
    toggleTodo: (id: number) => void;
  }
>((set) => ({
  ...initialState,
  setFilter: (filter: "all" | "active" | "completed") =>
    set((state) => ({ ...state, filter })),
  addTodo: (text: string) =>
    set((state) => ({
      ...state,
      todos: [...state.todos, { id: Date.now(), text, completed: false }],
    })),
  toggleTodo: (id: number) =>
    set((state) => ({
      ...state,
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    })),
}));
