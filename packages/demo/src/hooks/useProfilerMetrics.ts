import { useState } from "react";

export const useProfilerMetrics = (id: string) => {
  const [metrics, setMetrics] = useState({
    updateTime: 0,
    mountTime: 0,
  });

  const onRender = (id_: string, phase: string, actualDuration: number) => {
    if (id_ === id) {
      if (phase === "mount") {
        setMetrics({ ...metrics, mountTime: actualDuration });
      } else if (phase === "update") {
        setMetrics({ ...metrics, updateTime: actualDuration });
      }
    }
  };

  return { metrics, onRender };
};
