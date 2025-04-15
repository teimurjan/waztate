import { useMemo, useState } from "react";
import { Filter } from "@/store/shared/types";
import { TodoList } from "../shared/TodoList";
import { useTodoStore } from "@/store/zustand/todoStore";

export function ZustandTodoList() {
  const [newTodo, setNewTodo] = useState("");
  const { todos, filter, addTodo, toggleTodo, setFilter } = useTodoStore();
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filter === "completed") {
        return todo.completed;
      }
      if (filter === "active") {
        return !todo.completed;
      }
      return true;
    });
  }, [todos]);

  return (
    <TodoList
      newTodo={newTodo}
      setNewTodo={setNewTodo}
      addTodo={() => addTodo(newTodo)}
      todos={filteredTodos}
      activeFilter={filter}
      setActiveFilter={(value) => setFilter(value as Filter)}
      onToggleTodo={(id) => toggleTodo(id)}
    />
  );
}
