import type { State, StateCreator, Store } from "@waztate/types";
import { StoreHandle, start } from "@waztate/wasm";

/**
 * Configuration for the auto-batching system
 */
interface BatchingConfig {
  readonly updateHistorySize: number;
  readonly frequencyThresholdMs: number;
  readonly autoDisableTimeoutMs: number;
  readonly burstCountThreshold: number;
  readonly burstTimeThresholdMs: number;
}

/**
 * Core store manager that handles WASM interactions and batching
 */
class StoreManager {
  private static instance: StoreManager | null = null;
  private storeHandle: StoreHandle | null = null;
  private initialized = false;
  private batchingEnabled = false;
  private autoBatchingEnabled = true;
  private pendingUpdates = new Map<string, any>();
  private batchPromise: Promise<void> | null = null;
  private updateTimestamps: number[] = [];
  private disableBatchingTimeout: number | null = null;

  // Configuration
  private config: BatchingConfig = {
    updateHistorySize: 10,
    frequencyThresholdMs: 50,
    autoDisableTimeoutMs: 2000,
    burstCountThreshold: 3,
    burstTimeThresholdMs: 20,
  };

  private constructor() {}

  /**
   * Get the singleton instance of StoreManager
   */
  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }
    return StoreManager.instance;
  }

  /**
   * Initialize and retrieve the WASM store handle
   */
  public getStoreHandle(): StoreHandle {
    if (!this.initialized) {
      start();
      this.initialized = true;
    }

    if (!this.storeHandle) {
      this.storeHandle = new StoreHandle();
    }

    if (!this.storeHandle) {
      throw new Error("Failed to initialize WASM store handle");
    }

    return this.storeHandle;
  }

  /**
   * Schedule a microtask to flush pending updates
   */
  public scheduleBatchedUpdates(): Promise<void> | null {
    if (this.batchPromise === null) {
      this.batchPromise = new Promise((resolve) => {
        const updates = new Map(this.pendingUpdates);
        this.pendingUpdates.clear();
        this.batchPromise = null;

        const storeHandle = this.getStoreHandle();

        // Create an array of [key, value, isFunction] entries
        const batchEntries = Array.from(updates).map(([key, value]) => {
          const isFunction = typeof value === "function";
          return [key, value, isFunction];
        });

        // Use the new batch_set method
        if (batchEntries.length > 0) {
          storeHandle.batch_set(batchEntries);
        }
        resolve();
      });
    }
    return this.batchPromise;
  }

  /**
   * Update state with optional batching
   */
  public setState<T extends State>(
    key: string,
    partial: T | Partial<T> | ((state: T) => T | Partial<T>)
  ): boolean {
    // Check for frequent updates if auto-detection is enabled
    if (this.autoBatchingEnabled) {
      this.checkUpdateFrequency();
    }

    if (!this.batchingEnabled) {
      // Immediate mode
      const isFunction = typeof partial === "function";
      return this.getStoreHandle().set(key, partial as any, isFunction);
    } else {
      // Batched mode
      this.addToBatch(key, partial);
      this.scheduleBatchedUpdates();
      return true; // Optimistically return true
    }
  }

  /**
   * Add an update to the batch with proper handling of function updaters
   */
  private addToBatch<T extends State>(
    key: string,
    partial: T | Partial<T> | ((state: T) => T | Partial<T>)
  ): void {
    if (typeof partial === "function") {
      this.handleFunctionUpdater(key, partial as (state: T) => T | Partial<T>);
    } else {
      // Direct value updates always overwrite
      this.pendingUpdates.set(key, partial);
    }
  }

  /**
   * Handle function updaters with proper chaining
   */
  private handleFunctionUpdater<T extends State>(
    key: string,
    updater: (state: T) => T | Partial<T>
  ): void {
    if (this.pendingUpdates.has(key)) {
      const existingUpdater = this.pendingUpdates.get(key);

      if (typeof existingUpdater === "function") {
        // Chain function updaters
        this.pendingUpdates.set(key, (state: T) => {
          const intermediateState = existingUpdater(state);
          return updater(intermediateState);
        });
      } else {
        // Use existing value as input to the function
        this.pendingUpdates.set(key, (state: T) => {
          return updater(existingUpdater as T);
        });
      }
    } else {
      // No existing updater, just set this one
      this.pendingUpdates.set(key, updater);
    }
  }

  /**
   * Get the current state, considering any pending updates
   */
  public getState<T extends State>(key: string): T {
    return this.getStoreHandle().get(key) as T;
  }

  /**
   * Subscribe to store changes
   */
  public subscribe(key: string, listener: (state: any) => void): () => void {
    const id = this.getStoreHandle().subscribe(key, listener);
    return () => {
      this.getStoreHandle().unsubscribe(id);
    };
  }

  /**
   * Check if updates are happening frequently and enable batching if needed
   */
  private checkUpdateFrequency(): void {
    const now = Date.now();
    this.updateTimestamps.push(now);

    // Burst detection - react quickly to rapid updates
    if (this.updateTimestamps.length >= this.config.burstCountThreshold) {
      const recentUpdates = this.updateTimestamps.slice(
        -this.config.burstCountThreshold
      );
      const timeSpan =
        recentUpdates[recentUpdates.length - 1] - recentUpdates[0];

      // More aggressive burst detection - any 3 updates within 100ms should trigger batching
      if (
        (timeSpan <
          this.config.burstTimeThresholdMs * this.config.burstCountThreshold ||
          timeSpan < 100) &&
        !this.batchingEnabled
      ) {
        this.batchingEnabled = true;
        this.resetDisableTimeout();
        return;
      }
    }

    // Keep only recent updates
    if (this.updateTimestamps.length > this.config.updateHistorySize) {
      this.updateTimestamps.shift();
    }

    // Need at least a few data points for the rolling average approach
    if (this.updateTimestamps.length < 3) {
      return;
    }

    // Calculate average time between updates
    let totalDelta = 0;
    for (let i = 1; i < this.updateTimestamps.length; i++) {
      totalDelta += this.updateTimestamps[i] - this.updateTimestamps[i - 1];
    }
    const avgDelta = totalDelta / (this.updateTimestamps.length - 1);

    // If updates are frequent and auto-batching is enabled
    if (
      avgDelta < this.config.frequencyThresholdMs &&
      this.autoBatchingEnabled &&
      !this.batchingEnabled
    ) {
      this.batchingEnabled = true;
      this.resetDisableTimeout();
    }
  }

  /**
   * Reset the timeout for disabling batching after inactivity
   */
  private resetDisableTimeout(): void {
    if (this.disableBatchingTimeout !== null) {
      clearTimeout(this.disableBatchingTimeout);
    }

    this.disableBatchingTimeout = setTimeout(() => {
      // Only disable if no recent updates
      if (this.updateTimestamps.length > 0) {
        const timeSinceLastUpdate =
          Date.now() - this.updateTimestamps[this.updateTimestamps.length - 1];
        if (timeSinceLastUpdate > this.config.frequencyThresholdMs * 2) {
          this.batchingEnabled = false;
          this.updateTimestamps = [];
        }
      }
      this.disableBatchingTimeout = null;
    }, this.config.autoDisableTimeoutMs) as unknown as number;
  }

  /**
   * Enable or disable batching manually
   */
  public enableBatching(enabled = true): void {
    this.batchingEnabled = enabled;

    // If disabling batching, flush any pending updates
    if (!enabled && this.pendingUpdates.size > 0) {
      this.scheduleBatchedUpdates();
    }

    // If explicitly enabling/disabling, turn off auto-detection
    this.autoBatchingEnabled = false;

    // Clear timeout if it exists
    if (this.disableBatchingTimeout !== null) {
      clearTimeout(this.disableBatchingTimeout);
      this.disableBatchingTimeout = null;
    }
  }

  /**
   * Enable or disable automatic batching detection
   */
  public enableAutoBatching(enabled = true): void {
    this.autoBatchingEnabled = enabled;

    // Reset detection state
    this.updateTimestamps = [];

    // Clear existing timeout
    if (this.disableBatchingTimeout !== null) {
      clearTimeout(this.disableBatchingTimeout);
      this.disableBatchingTimeout = null;
    }

    // If disabling auto-batching and batching was auto-enabled, disable it
    if (!enabled && this.batchingEnabled) {
      this.batchingEnabled = false;

      // Flush any pending updates
      if (this.pendingUpdates.size > 0) {
        this.scheduleBatchedUpdates();
      }
    }
  }

  /**
   * Execute a callback within a batching context
   */
  public batch<T>(callback: () => T): T {
    const wasBatching = this.batchingEnabled;
    const wasAutoBatching = this.autoBatchingEnabled;

    // Disable auto-batching during explicit batching
    this.autoBatchingEnabled = false;
    this.batchingEnabled = true;

    try {
      return callback();
    } finally {
      // Restore previous state
      this.batchingEnabled = wasBatching;
      this.autoBatchingEnabled = wasAutoBatching;

      // Always flush updates when ending a manually created batch
      if (!wasBatching) {
        this.scheduleBatchedUpdates();
      }
    }
  }
}

/**
 * Create a new store with the given initializer and key
 */
export function createStore<T extends State>(
  initializer: StateCreator<T>,
  key: string
): Store<T> {
  const storeManager = StoreManager.getInstance();
  const storeHandle = storeManager.getStoreHandle();

  const initState = initializer();
  storeHandle.set(key, initState, false);

  return {
    setState: (partial) => storeManager.setState(key, partial),
    getState: () => storeManager.getState<T>(key),
    subscribe: (listener) => storeManager.subscribe(key, listener),
  };
}

/**
 * Enable or disable manual batching
 */
export function enableBatching(enabled = true): void {
  StoreManager.getInstance().enableBatching(enabled);
}

/**
 * Enable or disable automatic batching detection
 */
export function enableAutoBatching(enabled = true): void {
  StoreManager.getInstance().enableAutoBatching(enabled);
}

/**
 * Execute a callback within a batching context
 */
export function batch<T>(callback: () => T): T {
  return StoreManager.getInstance().batch(callback);
}
