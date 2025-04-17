# waztate

A performant React state management library powered by WebAssembly (WASM) and Rust.

## Features

- Fast state updates with WASM for computation-heavy operations
- Simple API with React hooks
- Efficient subscription system
- Type-safe with TypeScript

## Project Structure

This project consists of four main parts:

1. **Rust Core (`/rust`)**: The core state management logic written in Rust that compiles to WebAssembly
2. **Core Library (`/packages/lib`)**: The main TypeScript library that provides core functionality
3. **React Integration (`/packages/react`)**: React-specific hooks and utilities for easy integration
4. **Demo App (`/packages/demo`)**: An example React application showcasing the library

## Installation

> Note: This is a work in progress and not yet published to npm

```bash
# Install core library
npm install @waztate/wasm-store

# Install React integration
npm install @waztate/react
```

The library consists of two main packages:
- `@waztate/wasm-store`: Core state management functionality
- `@waztate/react`: React hooks and utilities

## Usage

### Basic Example

```tsx
import React from 'react';
import { createStore } from '@waztate/wasm-store';
import { useStore } from '@waztate/react';

// Create a store with initial state
const counterStore = createStore(() => ({
  count: 0
}), 'counter');

const userStore = createStore(() => ({
  name: 'Guest',
  loggedIn: false
}), 'user');

function Counter() {
  // Use the store with hooks
  const count = useStore(counterStore);
  
  return (
    <div>
      <h2>Count: {count.count}</h2>
      <button onClick={() => counterStore.setState(state => ({ count: state.count + 1 }))}>
        Increment
      </button>
      <button onClick={() => counterStore.setState(state => ({ count: state.count - 1 }))}>
        Decrement
      </button>
    </div>
  );
}

function UserProfile() {
  const user = useStore(userStore);
  
  return (
    <div>
      <h2>User: {user.name}</h2>
      <button 
        onClick={() => userStore.setState(state => ({ 
          ...state, 
          loggedIn: !state.loggedIn 
        }))}
      >
        {user.loggedIn ? 'Logout' : 'Login'}
      </button>
    </div>
  );
}
```

### Using Selectors

```tsx
import { useStoreSelector } from '@waztate/react';

function UserLoginStatus() {
  // Only re-renders when the selected value changes
  const isLoggedIn = useStoreSelector(userStore, state => state.loggedIn);
  
  return (
    <div>
      Status: {isLoggedIn ? 'Logged In' : 'Logged Out'}
    </div>
  );
}
```

## Development

This is a monorepo managed with pnpm workspaces. To get started:

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Build the WASM module
pnpm build:wasm

# Build the core library
pnpm build:lib

# Build the React integration
pnpm build:react

# Run the demo app
pnpm dev:demo
```

Each package can be built individually using the commands above. The build process follows this order:
1. WASM module (from Rust code)
2. Core library
3. React integration
4. Demo app

## License

MIT 