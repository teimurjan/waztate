import { Filter } from "./types";

export const initialState = {
  todos: Array.from({ length: 1000000 }, (_, i) => ({
    id: i + 1,
    text: `Todo item ${i + 1}`,
    completed: i % 3 === 0,
  })),
  filter: "all" as Filter,
};
