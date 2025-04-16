import { Card, CardContent } from "@/components/ui/card";

interface ProfilerMetricsProps {
  updateTime?: number;
  mountTime?: number;
  className?: string;
}

export function ProfilerMetrics({
  updateTime = 0,
  mountTime = 0,
  className = "",
}: ProfilerMetricsProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Update Time</p>
              <p className="font-medium">{updateTime.toFixed(2)} ms</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Mount Time</p>
              <p className="font-medium">{mountTime.toFixed(2)} ms</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
