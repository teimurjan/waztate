import { actions } from "@/store/redux/todoSlice";
import { useAppSelector, useAppDispatch } from "@/store/redux/hooks";
import { useState } from "react";
import { Filter } from "@/store/shared/types";
import { TodoList } from "../shared/TodoList";

export function ReduxTodoList() {
  const todos = useAppSelector((state) =>
    state.todos.todos.filter((todo) => {
      if (state.todos.filter === "completed") {
        return todo.completed;
      }
      if (state.todos.filter === "active") {
        return !todo.completed;
      }
      return true;
    })
  );
  const filter = useAppSelector((state) => state.todos.filter);
  const dispatch = useAppDispatch();
  const [newTodo, setNewTodo] = useState("");

  return (
    <TodoList
      newTodo={newTodo}
      setNewTodo={setNewTodo}
      addTodo={() => dispatch(actions.addTodo(newTodo))}
      todos={todos}
      activeFilter={filter}
      setActiveFilter={(value) => dispatch(actions.setFilter(value as Filter))}
      onToggleTodo={(id) => dispatch(actions.toggleTodo(id))}
    />
  );
}
