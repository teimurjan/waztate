import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface BenchmarkProps {
  benchmarkTime?: number;
  running: boolean;
  runBenchmark: () => void;
  className?: string;
}

const Benchmark = ({
  benchmarkTime = 0,
  running,
  runBenchmark,
  className,
}: BenchmarkProps) => {
  return (
    <Card className={className}>
      <CardContent>
        <div>
          <p className="text-xs text-muted-foreground">Benchmark Time</p>
          <p className="font-medium">{benchmarkTime.toFixed(2)} ms</p>
        </div>
        <Button className="mt-8" onClick={runBenchmark} disabled={running}>
          {running ? "Running..." : "Run Benchmark"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Benchmark;
