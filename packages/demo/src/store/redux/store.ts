import { configureStore } from "@reduxjs/toolkit";
import { reducer as todosReducer } from "./todoSlice";
import { reducer as counterReducer } from "./counterSlice";

const store = configureStore({
  reducer: {
    todos: todosReducer,
    counter: counterReducer,
  },
});

type AppDispatch = typeof store.dispatch;
type RootState = ReturnType<typeof store.getState>;

export { store };
export type { AppDispatch, RootState };
