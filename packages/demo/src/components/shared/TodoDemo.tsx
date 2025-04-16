import { Provider } from "react-redux";
import { Profiler } from "react";
import { store } from "@/store/redux/store";
import { useProfilerMetrics } from "@/hooks/useProfilerMetrics";
import { ReduxTodoList } from "../redux/ReduxTodoList";
import { WaztateTodoList } from "../waztate/WaztateTodoList";
import { ZustandTodoList } from "../zustand/ZustandTodoList";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ProfilerMetrics } from "./ProfilerMetrics";

const TodoDemo = () => {
  const { metrics: waztateMetrics, onRender: onRenderWaztate } =
    useProfilerMetrics("waztate");
  const { metrics: reduxMetrics, onRender: onRenderRedux } =
    useProfilerMetrics("redux");
  const { metrics: zustandMetrics, onRender: onRenderZustand } =
    useProfilerMetrics("zustand");

  return (
    <div className="flex items-center justify-center w-full gap-4">
      <Card className="flex-1/3">
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

      <Card className="flex-1/3">
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

      <Card className="flex-1/3">
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
