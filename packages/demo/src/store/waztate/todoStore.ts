import { createStore } from "@waztate/lib";
import { initialState } from "../shared";
import { Filter, TodoState } from "../shared/types";

// Need to explicitly type the store to get TypeScript to recognize the batch method
const todoStore = createStore<TodoState>(() => initialState, "todo");

export { todoStore };

export const actions = {
  setFilter: (filter: Filter) =>
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

  reset: () => todoStore.setState(initialState),
};
