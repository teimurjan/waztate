import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Filter, Todo } from "@/store/shared/types";
import { FixedSizeList } from "react-window";
import { TodoItem } from "./TodoItem";

interface TodoListProps {
  newTodo: string;
  setNewTodo: (value: string) => void;
  addTodo: () => void;
  todos: Todo[];
  activeFilter: Filter;
  setActiveFilter: (value: Filter) => void;
  onToggleTodo: (id: number) => void;
}

const ITEM_SIZE = 56;

const Row = ({
  index,
  style,
  data,
}: {
  index: number;
  style: any;
  data: { todos: Todo[]; onToggle: (id: number) => void };
}) => {
  const todo = data.todos[index];
  return (
    <div style={style}>
      <TodoItem todo={todo} onToggle={data.onToggle} />
    </div>
  );
};

export function TodoList({
  newTodo,
  setNewTodo,
  addTodo,
  todos,
  activeFilter,
  setActiveFilter,
  onToggleTodo,
}: TodoListProps) {
  const handleAddTodo = () => {
    addTodo();
    setNewTodo("");
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeFilter}
        className="mb-2"
        onValueChange={(value) => setActiveFilter(value as Filter)}
      >
        <div className="flex w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <div className="flex gap-2">
        <Input
          placeholder="Add a new todo"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddTodo();
            }
          }}
        />
        <Button onClick={handleAddTodo}>Add</Button>
      </div>

      <div className="h-[200px]">
        <FixedSizeList
          height={200}
          width="100%"
          itemCount={todos.length}
          itemSize={ITEM_SIZE}
          itemData={{ todos, onToggle: onToggleTodo }}
        >
          {Row}
        </FixedSizeList>
      </div>
    </div>
  );
}
