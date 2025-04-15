import { useStore } from "@waztate/react";
import { todoStore, actions } from "@/store/waztate/todoStore";
import { Filter } from "@/store/shared/types";
import { TodoList } from "../shared/TodoList";
import { useState } from "react";

export function WaztateTodoList() {
  const [newTodo, setNewTodo] = useState("");
  const todos = useStore(todoStore, (state) =>
    state.todos.filter((todo) => {
      if (state.filter === "completed") {
        return todo.completed;
      }
      if (state.filter === "active") {
        return !todo.completed;
      }
      return true;
    })
  );
  const filter = useStore(todoStore, (state) => state.filter);

  return (
    <TodoList
      newTodo={newTodo}
      setNewTodo={setNewTodo}
      addTodo={() => actions.addTodo(newTodo)}
      todos={todos}
      activeFilter={filter}
      setActiveFilter={(value) => actions.setFilter(value as Filter)}
      onToggleTodo={(id) => actions.toggleTodo(id)}
    />
  );
}
