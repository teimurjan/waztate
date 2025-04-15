import { ReduxTodoList } from "./components/redux/ReduxTodoList";
import { WaztateTodoList } from "./components/waztate/WaztateTodoList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { store } from "./store/redux/store";
import { Provider } from "react-redux";
import { Profiler, useState } from "react";
import { PerformanceMetrics } from "./components/shared/PerformanceMetrics";
import { Button } from "./components/ui/button";

function App() {
  const [variant, setVariant] = useState("redux");

  const [waztateMetrics, setWaztateMetrics] = useState({
    updateTime: 0,
    mountTime: 0,
  });
  const [reduxMetrics, setReduxMetrics] = useState({
    updateTime: 0,
    mountTime: 0,
  });

  const handleProfilerUpdate = (
    id: string,
    phase: string,
    actualDuration: number
  ) => {
    if (id === "waztate") {
      if (phase === "mount") {
        setWaztateMetrics({ ...waztateMetrics, mountTime: actualDuration });
      } else if (phase === "update") {
        setWaztateMetrics({ ...waztateMetrics, updateTime: actualDuration });
      }
    }
    if (id === "redux") {
      if (phase === "mount") {
        setReduxMetrics({ ...reduxMetrics, mountTime: actualDuration });
      } else if (phase === "update") {
        setReduxMetrics({ ...reduxMetrics, updateTime: actualDuration });
      }
    }
  };

  // @ts-ignore
  console.log(performance.memory.usedJSHeapSize / 1024 / 1024);

  return (
    <main className="container mx-auto h-screen w-full flex flex-col items-center justify-center">
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setVariant("waztate")}>Waztate</Button>
        <Button onClick={() => setVariant("redux")}>Redux</Button>
      </div>

      <div className="flex items-center justify-center w-full">
        {variant === "waztate" && (
          <Card className="flex-1/2">
            <CardHeader>
              <CardTitle>Waztate</CardTitle>
              <CardDescription>Waztate implementation</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceMetrics
                className="mb-4"
                updateTime={waztateMetrics.updateTime}
                mountTime={waztateMetrics.mountTime}
              />
              <Profiler id="waztate" onRender={handleProfilerUpdate}>
                <WaztateTodoList />
              </Profiler>
            </CardContent>
          </Card>
        )}

        {variant === "redux" && (
          <Card className="flex-1/2">
            <CardHeader>
              <CardTitle>Redux</CardTitle>
              <CardDescription>Redux implementation</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceMetrics
                className="mb-4"
                updateTime={reduxMetrics.updateTime}
                mountTime={reduxMetrics.mountTime}
              />
              <Provider store={store}>
                <Profiler id="redux" onRender={handleProfilerUpdate}>
                  <ReduxTodoList />
                </Profiler>
              </Provider>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

export default App;
