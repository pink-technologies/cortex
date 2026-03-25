// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * In-memory storage of values keyed by a string.
 *
 * @typeParam T - Value type for this store instance (fixed for the lifetime of the storage).
 */
export interface InMemoryStorage<T> {
    /**
     * Returns the value for `key`, or `null` if none is set.
     *
     * @param key - The key to get the value for.
     * @returns The value, or `null` if none is set.
     */
    get(key: string): T | null;

    /**
     * Sets a value for the given key.
     *
     * @param value - The value to set.
     * @param key - The key to set the value for.
     */
    set(value: T, key: string): void;
}