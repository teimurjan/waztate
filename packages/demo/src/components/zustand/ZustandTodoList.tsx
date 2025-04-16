import { useMemo, useState } from "react";
import { Filter } from "@/store/shared/types";
import { TodoList } from "../shared/TodoList";
import { useTodoStore } from "@/store/zustand/todoStore";
import { useRunBenchmark } from "@/hooks/useRunBenchmark";
import Benchmark from "../shared/Benchmark";

export function ZustandTodoList() {
  const [newTodo, setNewTodo] = useState("");
  const { todos, filter, addTodo, reset, toggleTodo, setFilter } =
    useTodoStore();
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
  }, [filter, todos]);

  const { running, benchmarkTime, runBenchmark } = useRunBenchmark(
    () => reset(),
    (i) => addTodo(`New Todo ${i}`),
    10,
    100
  );

  return (
    <div className="flex flex-col gap-4">
      <TodoList
        newTodo={newTodo}
        setNewTodo={setNewTodo}
        addTodo={() => addTodo(newTodo)}
        todos={filteredTodos}
        activeFilter={filter}
        setActiveFilter={(value) => setFilter(value as Filter)}
        onToggleTodo={(id) => toggleTodo(id)}
      />
      <Benchmark
        benchmarkTime={benchmarkTime}
        running={running}
        runBenchmark={runBenchmark}
      />
    </div>
  );
}
