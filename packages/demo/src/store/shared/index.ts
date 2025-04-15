import { Filter } from "./types";

export const initialState = {
  todos: Array.from({ length: 1000 * 1000 }, (_, i) => ({
    id: i + 1,
    text: `Todo item ${i + 1}`,
    completed: false,
  })),
  filter: "all" as Filter,
};
