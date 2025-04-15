# waztate

A performant React state management library powered by WebAssembly (WASM) and Rust.

## Features

- Fast state updates with WASM for computation-heavy operations
- Simple API with React hooks
- Efficient subscription system
- Type-safe with TypeScript

## Project Structure

This project consists of three main parts:

1. **Rust Core**: The core state management logic written in Rust that compiles to WebAssembly
2. **JavaScript API**: TypeScript wrapper with React hooks for easy integration
3. **Demo App**: An example React application showcasing the library

## Installation

> Note: This is a work in progress and not yet published to npm

```bash
npm install waztate
```

## Usage

### Basic Example

```tsx
import React, { useEffect } from 'react';
import { createStore, useStore, setGlobalStore } from 'waztate';

// Initialize store
async function initStore() {
  const store = await createStore({
    initialState: {
      counter: 0,
      user: { name: 'Guest', loggedIn: false }
    }
  });
  
  // Set the global store so hooks can access it
  setGlobalStore(store);
}

// Initialize on app startup
initStore();

function Counter() {
  // Use the store like useState, but synchronized with the global store
  const [count, setCount] = useStore<number>('counter');
  
  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}

function UserProfile() {
  const [user, setUser] = useStore('user');
  
  return (
    <div>
      <h2>User: {user.name}</h2>
      <button 
        onClick={() => setUser({ 
          ...user, 
          loggedIn: !user.loggedIn 
        })}
      >
        {user.loggedIn ? 'Logout' : 'Login'}
      </button>
    </div>
  );
}
```

### Using Selectors

```tsx
import { useStoreSelector } from 'waztate';

function UserLoginStatus() {
  // Only re-renders when the selected value changes
  const isLoggedIn = useStoreSelector(state => state.user?.loggedIn || false);
  
  return (
    <div>
      Status: {isLoggedIn ? 'Logged In' : 'Logged Out'}
    </div>
  );
}
```

## Development

### Building the Rust Core

```bash
cd rust
wasm-pack build --release
```

### Building the JavaScript API

```bash
cd js
npm install
npm run build
```

### Running the Demo

```bash
cd demo
npm install
npm start
```

## License

MIT 