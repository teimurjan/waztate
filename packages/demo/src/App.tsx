import { useState } from "react";
import TodoDemo from "./components/shared/TodoDemo";
import CounterDemo from "./components/shared/CounterDemo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

type Tab = "easy" | "medium" | "hard";

const App = () => {
  const [tab, setTab] = useState<Tab>("medium");
  return (
    <main className="h-screen w-full flex flex-col items-center justify-center px-12">
      <h1 className="text-2xl font-bold mb-16 text-center">
        Still using Redux and Zustand?
        <br />
        Check the power of WASM-based state manager.
      </h1>

      <Tabs
        value={tab}
        className="mb-6 w-full"
        onValueChange={(value) => setTab(value as Tab)}
      >
        <div className="flex w-full">
          <TabsList className="w-full">
            <TabsTrigger value="easy">Tiny Example</TabsTrigger>
            <TabsTrigger value="medium">Medium Example</TabsTrigger>
            <TabsTrigger value="hard">Hard Example</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="easy">
          <CounterDemo />
        </TabsContent>

        <TabsContent value="medium">
          <TodoDemo />
        </TabsContent>

        <TabsContent value="hard">Hard</TabsContent>
      </Tabs>
    </main>
  );
};

export default App;
