import { Provider } from "react-redux";
import { Profiler } from "react";
import { store } from "@/store/redux/store";
import { useProfilerMetrics } from "@/hooks/useProfilerMetrics";
import { ReduxTodoList } from "../redux/ReduxTodoList";
import { WaztateWasmTodoList } from "../waztate-wasm/WaztateWasmTodoList";
import { ZustandTodoList } from "../zustand/ZustandTodoList";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ProfilerMetrics } from "./ProfilerMetrics";
import { WaztateTodoList } from "../waztate/WaztateTodoList";

const TodoDemo = () => {
  const { metrics: waztateWasmMetrics, onRender: onRenderWaztateWasm } =
    useProfilerMetrics("waztate-wasm");
  const { metrics: waztateMetrics, onRender: onRenderWaztate } =
    useProfilerMetrics("waztate");
  const { metrics: reduxMetrics, onRender: onRenderRedux } =
    useProfilerMetrics("redux");
  const { metrics: zustandMetrics, onRender: onRenderZustand } =
    useProfilerMetrics("zustand");

  return (
    <div className="flex items-center justify-center w-full gap-4">
      <Card className="flex-1/4">
        <CardHeader>
          <CardTitle>Redux</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilerMetrics
            className="mb-4"
            updateTime={reduxMetrics.updateTime}
            mountTime={reduxMetrics.mountTime}
          />
          <Provider store={store}>
            <Profiler id="redux" onRender={onRenderRedux}>
              <ReduxTodoList />
            </Profiler>
          </Provider>
        </CardContent>
      </Card>

      <Card className="flex-1/4">
        <CardHeader>
          <CardTitle>Waztate WASM ⚡️</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilerMetrics
            className="mb-4 bg-green-300/20"
            updateTime={waztateWasmMetrics.updateTime}
            mountTime={waztateWasmMetrics.mountTime}
          />
          <Profiler id="waztate-wasm" onRender={onRenderWaztateWasm}>
            <WaztateWasmTodoList />
          </Profiler>
        </CardContent>
      </Card>

      <Card className="flex-1/4">
        <CardHeader>
          <CardTitle>Waztate ⚡️</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilerMetrics
            className="mb-4 bg-green-300/20"
            updateTime={waztateMetrics.updateTime}
            mountTime={waztateMetrics.mountTime}
          />
          <Profiler id="waztate" onRender={onRenderWaztate}>
            <WaztateTodoList />
          </Profiler>
        </CardContent>
      </Card>

      <Card className="flex-1/4">
        <CardHeader>
          <CardTitle>Zustand</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilerMetrics
            className="mb-4"
            updateTime={zustandMetrics.updateTime}
            mountTime={zustandMetrics.mountTime}
          />
          <Profiler id="zustand" onRender={onRenderZustand}>
            <ZustandTodoList />
          </Profiler>
        </CardContent>
      </Card>
    </div>
  );
};

export default TodoDemo;
