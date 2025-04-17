# @waztate/store

A pure TypeScript implementation of the waztate store.

## Installation

```bash
npm install @waztate/store
# or
pnpm add @waztate/store
# or
yarn add @waztate/store
```

## Usage

```typescript
import { createStore } from '@waztate/store';

// Create a store with initial state
const todoStore = createStore(() => ({
  todos: [],
  filter: 'all'
}), 'todos');

// Get the current state
const state = todoStore.getState();

// Update the state
todoStore.setState({ filter: 'active' });

// Update with a function
todoStore.setState((state) => ({
  todos: [...state.todos, { id: 1, text: 'New todo', completed: false }]
}));

// Subscribe to changes
const unsubscribe = todoStore.subscribe((state) => {
  console.log('State changed:', state);
});

// Later, unsubscribe
unsubscribe();

// Advanced features
import { enableBatching, enableAutoBatching, batch } from '@waztate/store';

// Enable batching for all stores
enableBatching(true);

// Enable automatic batching detection (default is true)
enableAutoBatching(true);

// Run multiple updates in a batch
batch(() => {
  todoStore.setState({ filter: 'completed' });
  todoStore.setState((state) => ({
    todos: state.todos.map(todo => ({ ...todo, completed: true }))
  }));
});
```

## Features

- Zero dependencies
- TypeScript support
- Auto-batching with intelligent detection
- Function updaters
- Subscription system
- Optimized for performance 