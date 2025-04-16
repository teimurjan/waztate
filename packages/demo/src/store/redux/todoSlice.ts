import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Filter } from "../shared/types";
import { initialState } from "../shared";

const todoSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<Filter>) => {
      state.filter = action.payload;
    },
    addTodo: (state, action: PayloadAction<string>) => {
      state.todos.push({
        id: Date.now(),
        text: action.payload,
        completed: false,
      });
    },
    toggleTodo: (state, action: PayloadAction<number>) => {
      const todo = state.todos.find((todo) => todo.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
    reset: () => initialState,
  },
});

export const actions = todoSlice.actions;
export const reducer = todoSlice.reducer;
