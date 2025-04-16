import { useState } from "react";
import { useStore } from "@waztate/react";
import { todoStore, actions } from "@/store/waztate/todoStore";
import { Filter } from "@/store/shared/types";
import { useRunBenchmark } from "@/hooks/useRunBenchmark";
import { TodoList } from "../shared/TodoList";
import Benchmark from "../shared/Benchmark";

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

  const { running, benchmarkTime, runBenchmark } = useRunBenchmark(
    () => actions.reset(),
    (i) => actions.addTodo(`New Todo ${i}`),
    10,
    100
  );

  return (
    <div className="flex flex-col gap-4">
      <TodoList
        newTodo={newTodo}
        setNewTodo={setNewTodo}
        addTodo={() => actions.addTodo(newTodo)}
        todos={todos}
        activeFilter={filter}
        setActiveFilter={(value) => actions.setFilter(value as Filter)}
        onToggleTodo={(id) => actions.toggleTodo(id)}
      />

      <Benchmark
        benchmarkTime={benchmarkTime}
        running={running}
        runBenchmark={runBenchmark}
      />
    </div>
  );
}
