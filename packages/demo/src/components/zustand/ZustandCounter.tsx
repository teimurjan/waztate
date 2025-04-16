import { useCounterStore } from "@/store/zustand/counterStore";
import { useRunBenchmark } from "@/hooks/useRunBenchmark";
import Benchmark from "../shared/Benchmark";

export function ZustandCounter() {
  const { value, increment, reset } = useCounterStore();
  const { running, benchmarkTime, runBenchmark } = useRunBenchmark(
    () => reset(),
    () => increment()
  );

  return (
    <div className="flex flex-col items-center">
      <div className="text-xl mb-2">Count: {value.toLocaleString()}</div>

      <Benchmark
        className="w-full"
        benchmarkTime={benchmarkTime}
        running={running}
        runBenchmark={runBenchmark}
      />
    </div>
  );
}
