import { ReduxTodoList } from "./components/redux/ReduxTodoList";
import { WaztateTodoList } from "./components/waztate/WaztateTodoList";
import { ZustandTodoList } from "./components/zustand/ZustandTodoList";
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

function App() {
  const [waztateMetrics, setWaztateMetrics] = useState({
    updateTime: 0,
    mountTime: 0,
  });
  const [reduxMetrics, setReduxMetrics] = useState({
    updateTime: 0,
    mountTime: 0,
  });
  const [zustandMetrics, setZustandMetrics] = useState({
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
    if (id === "zustand") {
      if (phase === "mount") {
        setZustandMetrics({ ...zustandMetrics, mountTime: actualDuration });
      } else if (phase === "update") {
        setZustandMetrics({ ...zustandMetrics, updateTime: actualDuration });
      }
    }
  };

  return (
    <main className="container mx-auto h-screen w-full flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-16 text-center">
        Still using Redux and Zustand?
        <br />
        Check the power of WASM-based state manager.
      </h1>

      <div className="flex items-center justify-center w-full gap-4">
        <Card className="flex-1/3">
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

        <Card className="flex-1/3">
          <CardHeader>
            <CardTitle>Waztate ⚡️</CardTitle>
            <CardDescription>Waztate implementation</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceMetrics
              className="mb-4 bg-green-300/20"
              updateTime={waztateMetrics.updateTime}
              mountTime={waztateMetrics.mountTime}
            />
            <Profiler id="waztate" onRender={handleProfilerUpdate}>
              <WaztateTodoList />
            </Profiler>
          </CardContent>
        </Card>

        <Card className="flex-1/3">
          <CardHeader>
            <CardTitle>Zustand</CardTitle>
            <CardDescription>Zustand implementation</CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceMetrics
              className="mb-4"
              updateTime={zustandMetrics.updateTime}
              mountTime={zustandMetrics.mountTime}
            />
            <Profiler id="zustand" onRender={handleProfilerUpdate}>
              <ZustandTodoList />
            </Profiler>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default App;
