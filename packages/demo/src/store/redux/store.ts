import { configureStore } from "@reduxjs/toolkit";
import { reducer as todosReducer } from "./todoSlice";

const store = configureStore({
  reducer: {
    todos: todosReducer,
  },
});

type AppDispatch = typeof store.dispatch;
type RootState = ReturnType<typeof store.getState>;

export { store };
export type { AppDispatch, RootState };
