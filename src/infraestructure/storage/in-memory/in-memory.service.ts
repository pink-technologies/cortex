// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { InMemoryStorage } from '../interfaces/in-memory.interface';
import { Injectable } from '@nestjs/common'

/**
 * Implementation of {@link InMemoryStorage} using a Map.
 *
 * Exposes {@link get}, {@link set} methods.
 *
 * @typeParam T - Value type held by this instance’s storage (one store, one value type).
 */
@Injectable()
export class InMemoryStorageService<T> implements InMemoryStorage<T> {
    // MARK: - Constructor

    /**
     * @param storage - Backing storage; keys are string ids, values are of type `T`.
     */
    public constructor(private readonly storage: Map<string, T>) { }

    // MARK: - InMemoryStorage

    /**
     * Returns the value for `key`, or `null` if none is registered.
     *
     * @param key - The key to get the value for.
     * @returns The value, or `null` if none is registered.
     */
    get(key: string): T | null {
        return this.storage.get(key) ?? null;
    }

    /**
     * Sets a value for the given key.
     *
     * @param value - The value to set.
     * @param key - The key to set the value for.
     */
    set(value: T, key: string): void {
        this.storage.set(key, value);
    }
}
