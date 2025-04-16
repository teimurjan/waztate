import { Provider } from "react-redux";
import { store } from "@/store/redux/store";
import { ReduxCounter } from "../redux/ReduxCounter";
import { WaztateCounter } from "../waztate/WaztateCounter";
import { ZustandCounter } from "../zustand/ZustandCounter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";

const CounterDemo = () => {
  return (
    <div className="flex items-center justify-center w-full gap-4">
      <Card className="flex-1/3">
        <CardHeader>
          <CardTitle>Redux</CardTitle>
        </CardHeader>
        <CardContent>
          <Provider store={store}>
            <ReduxCounter />
          </Provider>
        </CardContent>
      </Card>

      <Card className="flex-1/3">
        <CardHeader>
          <CardTitle>Waztate ⚡️</CardTitle>
        </CardHeader>
        <CardContent>
          <WaztateCounter />
        </CardContent>
      </Card>

      <Card className="flex-1/3">
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
