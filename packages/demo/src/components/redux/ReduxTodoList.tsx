import { actions } from "@/store/redux/todoSlice";
import { useAppSelector, useAppDispatch } from "@/store/redux/hooks";
import { useState } from "react";
import { Filter } from "@/store/shared/types";
import { useRunBenchmark } from "@/hooks/useRunBenchmark";
import { TodoList } from "../shared/TodoList";
import Benchmark from "../shared/Benchmark";

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

  const { running, benchmarkTime, runBenchmark } = useRunBenchmark(
    () => dispatch(actions.reset()),
    (i) => dispatch(actions.addTodo(`New Todo ${i}`)),
    10,
    100
  );

  return (
    <div className="flex flex-col gap-4">
      <TodoList
        newTodo={newTodo}
        setNewTodo={setNewTodo}
        addTodo={() => dispatch(actions.addTodo(newTodo))}
        todos={todos}
        activeFilter={filter}
        setActiveFilter={(value) =>
          dispatch(actions.setFilter(value as Filter))
        }
        onToggleTodo={(id) => dispatch(actions.toggleTodo(id))}
      />
      <Benchmark
        benchmarkTime={benchmarkTime}
        running={running}
        runBenchmark={runBenchmark}
      />
    </div>
  );
}
