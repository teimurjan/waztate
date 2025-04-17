import type { State, StateCreator, Store } from "@waztate/types";

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
 * Core store manager that handles state management and batching
 */
class StoreManager {
  private static instance: StoreManager | null = null;
  private stores: Map<string, any> = new Map();
  // Optimize subscription lookup by storing subscribers by key
  private subscriptionsByKey: Map<string, Set<{ id: number; callback: Function }>> = new Map();
  private nextSubId: number = 1;
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
   * Get the current state for a store key
   */
  public getState<T extends State>(key: string): T {
    if (!this.stores.has(key)) {
      throw new Error(`Store with key '${key}' does not exist`);
    }
    return this.stores.get(key) as T;
  }

  /**
   * Fast shallow equality check for objects
   */
  private shallowEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    
    if (typeof obj1 !== 'object' || obj1 === null || 
        typeof obj2 !== 'object' || obj2 === null) {
      return false;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }
    
    return true;
  }

  /**
   * Set the state for a store key with batching support
   */
  public setState<T extends State>(
    key: string,
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    isFunction: boolean = typeof partial === "function"
  ): boolean {
    // Check for frequent updates if auto-detection is enabled
    if (this.autoBatchingEnabled) {
      this.checkUpdateFrequency();
    }

    if (!this.batchingEnabled) {
      // Immediate mode
      return this.directSetState(key, partial, isFunction);
    } else {
      // Batched mode
      this.addToBatch(key, partial);
      this.scheduleBatchedUpdates();
      return true; // Optimistically return true
    }
  }

  /**
   * Directly apply an update to the state
   */
  private directSetState<T extends State>(
    key: string,
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    isFunction: boolean
  ): boolean {
    if (!this.stores.has(key)) {
      throw new Error(`Store with key '${key}' does not exist`);
    }

    let currentState = this.stores.get(key) as T;
    let nextState: T;

    if (isFunction) {
      const updater = partial as (state: T) => T | Partial<T>;
      const result = updater(currentState);

      if (
        typeof result === "object" &&
        result !== null &&
        !Array.isArray(result)
      ) {
        nextState = { ...currentState, ...result };
      } else {
        nextState = result as T;
      }
    } else if (
      typeof partial === "object" &&
      partial !== null &&
      !Array.isArray(partial)
    ) {
      nextState = { ...currentState, ...(partial as Partial<T>) };
    } else {
      nextState = partial as T;
    }

    // Only update if state has changed - use fast shallow comparison instead of JSON.stringify
    if (this.shallowEqual(currentState, nextState)) {
      return false;
    }

    this.stores.set(key, nextState);
    this.notifySubscribers(key);
    return true;
  }

  /**
   * Notify subscribers about state changes
   */
  private notifySubscribers(key: string): void {
    const state = this.stores.get(key);
    
    // Directly use the subscribers for this key
    const subscribers = this.subscriptionsByKey.get(key);
    if (subscribers) {
      for (const sub of subscribers) {
        try {
          sub.callback(state);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      }
    }
  }

  /**
   * Schedule a microtask to flush pending updates
   */
  public scheduleBatchedUpdates(): Promise<void> | null {
    if (this.batchPromise === null) {
      this.batchPromise = Promise.resolve().then(() => {
        const updates = new Map(this.pendingUpdates);
        this.pendingUpdates.clear();
        this.batchPromise = null;

        // Process all batched updates
        this.batchSet(updates);
      });
    }
    return this.batchPromise;
  }

  /**
   * Apply a batch of updates efficiently
   */
  private batchSet(updates: Map<string, any>): boolean {
    if (updates.size === 0) return false;

    // Convert updates to array of entries for consistent processing
    const batchEntries = Array.from(updates).map(([key, value]) => {
      const isFunction = typeof value === "function";
      return [key, value, isFunction];
    });

    // Track if any updates actually changed state
    let anyStateChanged = false;

    // Process all updates
    for (const [key, value, isFunction] of batchEntries) {
      const changed = this.directSetState(key, value, isFunction as boolean);
      anyStateChanged = anyStateChanged || changed;
    }

    return anyStateChanged;
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
        this.pendingUpdates.set(key, (_state: T) => {
          return updater(existingUpdater as T);
        });
      }
    } else {
      // No existing updater, just set this one
      this.pendingUpdates.set(key, updater);
    }
  }

  /**
   * Initialize a new store with the given key and initial state
   */
  public initStore<T extends State>(
    initializer: StateCreator<T>,
    key: string
  ): T {
    if (this.stores.has(key)) {
      console.warn(
        `Store with key '${key}' already exists. Returning existing store.`
      );
      return this.stores.get(key) as T;
    }

    const state = initializer();
    this.stores.set(key, state);
    // Initialize an empty subscriber set for this key
    this.subscriptionsByKey.set(key, new Set());
    return state;
  }

  /**
   * Subscribe to store changes
   */
  public subscribe(key: string, callback: Function): number {
    if (!this.stores.has(key)) {
      throw new Error(
        `Cannot subscribe to nonexistent store with key '${key}'`
      );
    }

    const id = this.nextSubId++;
    
    // Add to the per-key subscriber set
    if (!this.subscriptionsByKey.has(key)) {
      this.subscriptionsByKey.set(key, new Set());
    }
    
    this.subscriptionsByKey.get(key)!.add({ id, callback });
    return id;
  }

  /**
   * Unsubscribe from store changes
   */
  public unsubscribe(id: number): boolean {
    // Search through all key subscription sets
    for (const [_key, subscribers] of this.subscriptionsByKey.entries()) {
      for (const sub of subscribers) {
        if (sub.id === id) {
          subscribers.delete(sub);
          return true;
        }
      }
    }
    return false;
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

    this.disableBatchingTimeout = window.setTimeout(() => {
      // Only disable if no recent updates
      if (this.updateTimestamps.length > 0) {
        const timeSinceLastUpdate =
          Date.now() - this.updateTimestamps[this.updateTimestamps.length - 1];
        if (timeSinceLastUpdate < this.config.autoDisableTimeoutMs) {
          this.resetDisableTimeout();
          return;
        }
      }

      this.batchingEnabled = false;
      this.disableBatchingTimeout = null;
    }, this.config.autoDisableTimeoutMs);
  }

  /**
   * Manually enable or disable batching
   */
  public enableBatching(enabled = true): void {
    this.batchingEnabled = enabled;

    // If we're disabling batching, flush any pending updates immediately
    if (!enabled && this.pendingUpdates.size > 0) {
      this.scheduleBatchedUpdates();
    }

    // Reset auto-disable timeout if enabling batching
    if (enabled) {
      this.resetDisableTimeout();
    } else if (this.disableBatchingTimeout !== null) {
      clearTimeout(this.disableBatchingTimeout);
      this.disableBatchingTimeout = null;
    }
  }

  /**
   * Enable or disable auto-batching detection
   */
  public enableAutoBatching(enabled = true): void {
    this.autoBatchingEnabled = enabled;

    // If disabling auto-batching and batching is currently enabled,
    // only disable batching if it was auto-enabled
    if (
      !enabled &&
      this.batchingEnabled &&
      this.disableBatchingTimeout !== null
    ) {
      clearTimeout(this.disableBatchingTimeout);
      this.disableBatchingTimeout = null;
      this.batchingEnabled = false;

      // Flush any pending updates
      if (this.pendingUpdates.size > 0) {
        this.scheduleBatchedUpdates();
      }
    }
  }

  /**
   * Run a callback with batching temporarily enabled
   */
  public batch<T>(callback: () => T): T {
    const wasBatchingEnabled = this.batchingEnabled;

    // Enable batching for this callback
    this.batchingEnabled = true;

    try {
      const result = callback();

      // Ensure all updates are flushed before returning
      if (this.pendingUpdates.size > 0) {
        this.scheduleBatchedUpdates();
      }

      return result;
    } finally {
      // Restore previous batching state
      this.batchingEnabled = wasBatchingEnabled;
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
  const manager = StoreManager.getInstance();
  manager.initStore(initializer, key);

  return {
    getState: () => manager.getState<T>(key),
    setState: (partial) => manager.setState<T>(key, partial),
    subscribe: (listener) => {
      const id = manager.subscribe(key, listener);
      return () => {
        manager.unsubscribe(id);
      };
    },
  };
}

/**
 * Enable or disable batching for all stores
 */
export function enableBatching(enabled = true): void {
  const manager = StoreManager.getInstance();
  manager.enableBatching(enabled);
}

/**
 * Enable or disable auto-batching detection
 */
export function enableAutoBatching(enabled = true): void {
  const manager = StoreManager.getInstance();
  manager.enableAutoBatching(enabled);
}

/**
 * Run a callback with batching temporarily enabled
 */
export function batch<T>(callback: () => T): T {
  const manager = StoreManager.getInstance();
  return manager.batch(callback);
}
