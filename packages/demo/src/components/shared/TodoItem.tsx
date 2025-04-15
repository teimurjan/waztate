import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Todo } from "@/store/shared/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  prefix?: string;
}

export const TodoItem = memo(
  ({ todo, onToggle, prefix = "todo" }: TodoItemProps) => {
    return (
      <div className="flex items-center justify-between p-3 border rounded-md">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => onToggle(todo.id)}
            id={`${prefix}-${todo.id}`}
          />
          <label
            htmlFor={`${prefix}-${todo.id}`}
            className={`${
              todo.completed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {todo.text}
          </label>
        </div>
      </div>
    );
  }
);

TodoItem.displayName = "TodoItem";
