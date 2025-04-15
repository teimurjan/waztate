import { createStore } from "@waztate/lib";
import { initialState } from "../shared";

export const todoStore = createStore(() => initialState, "todo");

export const actions = {
  setFilter: (filter: "all" | "active" | "completed") =>
    todoStore.setState((state) => ({ ...state, filter })),

  addTodo: (text: string) =>
    todoStore.setState((state) => ({
      ...state,
      todos: [...state.todos, { id: Date.now(), text, completed: false }],
    })),

  toggleTodo: (id: number) =>
    todoStore.setState((state) => ({
      ...state,
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    })),
};
