import { useDispatch } from "react-redux";
import { actions } from "@/store/redux/counterSlice";
import { useRunBenchmark } from "@/hooks/useRunBenchmark";
import { useAppSelector } from "@/store/redux/hooks";
import Benchmark from "../shared/Benchmark";

export function ReduxCounter() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useDispatch();
  const { running, benchmarkTime, runBenchmark } = useRunBenchmark(
    () => dispatch(actions.reset()),
    () => dispatch(actions.increment())
  );

  return (
    <div className="flex flex-col items-center">
      <div className="text-xl mb-2">Count: {count.toLocaleString()}</div>

      <Benchmark
        className="w-full"
        benchmarkTime={benchmarkTime}
        running={running}
        runBenchmark={runBenchmark}
      />
    </div>
  );
}
