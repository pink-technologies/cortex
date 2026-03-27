// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Key-value storage: {@link read} / {@link write} / {@link delete} (async).
 * Same role as sync `get`/`set` on a map; only the async surface is exposed.
 *
 * Type parameters live on {@link ReadableStorage.read} and {@link WritableStorage.write},
 * not on the storage itself — one instance can hold heterogeneous value types per key.
 *
 * Analogous to Swift's XStorage (ReadableStorage & WritableStorage).
 */
export type Storage = ReadableStorage & WritableStorage;

/**
 * Interface for reading data from storage.
 *
 * Analogous to Swift's ReadableStorage protocol.
 */
export interface ReadableStorage {
    /**
     * Fetches the value for the given key.
     *
     * @param key - The storage key.
     * @returns The value, or `null` if no value exists for the key.
     * @throws When the read operation fails (e.g. backend error).
     */
    read<T>(key: string): Promise<T | null>;
}

/**
 * Interface for writing data to storage.
 *
 * Analogous to Swift's WritableStorage protocol.
 */
export interface WritableStorage {
    /**
     * Deletes a key from the storage.
     *
     * @param key - The key to delete.
     * @throws When the delete operation fails.
     */
    delete(key: string): Promise<void>;

    /**
     * Writes the value for the given key.
     *
     * @param value - The value to store (must be JSON-serializable).
     * @param key - The key to store the value under.
     * @throws When the write operation fails.
     */
    write<T>(value: T, key: string): Promise<void>;
}
