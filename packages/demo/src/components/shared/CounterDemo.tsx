import { Provider } from "react-redux";
import { store } from "@/store/redux/store";
import { ReduxCounter } from "../redux/ReduxCounter";
import { WaztateWasmCounter } from "../waztate-wasm/WaztateWasmCounter";
import { ZustandCounter } from "../zustand/ZustandCounter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { WaztateCounter } from "../waztate/WaztateCounter";

const CounterDemo = () => {
  return (
    <div className="flex items-center justify-center w-full gap-4">
      <Card className="flex-1/4">
        <CardHeader>
          <CardTitle>Redux</CardTitle>
        </CardHeader>
        <CardContent>
          <Provider store={store}>
            <ReduxCounter />
          </Provider>
        </CardContent>
      </Card>

      <Card className="flex-1/4">
        <CardHeader>
          <CardTitle>Waztate WASM ⚡️</CardTitle>
        </CardHeader>
        <CardContent>
          <WaztateWasmCounter />
        </CardContent>
      </Card>

      <Card className="flex-1/4">
        <CardHeader>
          <CardTitle>Waztate ⚡️</CardTitle>
        </CardHeader>
        <CardContent>
          <WaztateCounter />
        </CardContent>
      </Card>

      <Card className="flex-1/4">
        <CardHeader>
          <CardTitle>Zustand</CardTitle>
        </CardHeader>
        <CardContent>
          <ZustandCounter />
        </CardContent>
      </Card>
    </div>
  );
};

export default CounterDemo;
