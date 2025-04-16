import { useState } from "react";

export const useRunBenchmark = (
  before: () => void,
  fn: (i?: number) => void,
  batchSize = 10000,
  maxIterations = 10000000
) => {
  const [running, setRunning] = useState(false);
  const [benchmarkTime, setBenchmarkTime] = useState<number>();

  const runBenchmark = () => {
    before();
    setRunning(true);
    const startTime = performance.now();

    let i = 0;
    const run = () => {
      for (let batch = 0; batch < batchSize; batch++) {
        fn(i++);
      }

      if (i < maxIterations) {
        setTimeout(run, 0);
      } else {
        const endTime = performance.now();
        setBenchmarkTime(endTime - startTime);
        setRunning(false);
      }
    };

    run();
  };

  return { running, benchmarkTime, runBenchmark };
};
