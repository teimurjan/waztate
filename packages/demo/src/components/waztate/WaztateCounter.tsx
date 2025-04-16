import { useStore } from "@waztate/react";
import { counterStore, actions } from "@/store/waztate/counterStore";
import { useRunBenchmark } from "@/hooks/useRunBenchmark";
import Benchmark from "../shared/Benchmark";

export function WaztateCounter() {
  const count = useStore(counterStore, (state) => state.value);
  const { running, benchmarkTime, runBenchmark } = useRunBenchmark(
    () => actions.reset(),
    () => actions.increment()
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
