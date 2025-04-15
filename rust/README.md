# Waztate Rust Core

This is the Rust core implementation for the Waztate state management library.

## Building

To build the library, you need to have [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) installed:

```bash
cargo install wasm-pack
```

Then build the project:

```bash
# Build for development (unoptimized, with more debug info)
wasm-pack build --dev

# Build for production (optimized, smaller output)
wasm-pack build --release
```

This will create a `pkg` directory with the WebAssembly files and JavaScript bindings.

## Development

The core state management logic is implemented in `src/lib.rs`. The library exposes a `StoreHandle` class through WebAssembly bindings that provides methods for:

- Getting state values (`get`)
- Setting state values (`set`)
- Subscribing to state changes (`subscribe`) 
- Unsubscribing from state changes (`unsubscribe`)
- Getting all keys in the store (`get_keys`)

## Testing

Run tests with:

```bash
wasm-pack test --node
```

## Architecture

The library uses a simple key-value store model that:

1. Maintains state in a Rust `HashMap`
2. Provides subscription capabilities with callbacks
3. Exposes a clean API through WebAssembly
4. Efficiently handles updates by only notifying subscribers when values actually change 