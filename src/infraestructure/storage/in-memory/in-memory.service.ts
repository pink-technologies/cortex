// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { StorageDeleteError, type Storage } from '../../storage';
import { ReadStorageError, StorageWriteError } from '../error/storage-error';

/**
 * Implementation of {@link Storage} backed by a {@link Map} (async API, in-memory).
 * Values may be heterogeneous; {@link read} / {@link write} narrow per call.
 */
@Injectable()
export class InMemoryStorageService implements Storage {
    // MARK: - Constructor

    /**
     * @param storage - Backing map; keys are string ids, values are untyped at rest.
     */
    public constructor(private readonly storage: Map<string, unknown>) { }

    // MARK: - Storage

    /**
     * Deletes the key from storage.
     *
     * @param key - Key to delete.
     */
    async delete(key: string): Promise<void> {
        try {
            this.storage.delete(key);
        } catch {
            throw new StorageDeleteError();
        }
    }
    /**
     * Fetches the value for the given key.
     *
     * @param key - Key to query.
     * @returns Value, or `null` if key does not exist.
     */
    async read<T>(key: string): Promise<T | null> {
        try {
            if (!this.storage.has(key)) {
                return null;
            }

            return this.storage.get(key) as T;
        } catch {
            throw new ReadStorageError();
        }
    }

    /**
     * Writes a value for the given key.
     *
     * @param value - Value to store.
     * @param key - Key to store the value under.
     */
    async write<T>(value: T, key: string): Promise<void> {
        try {
            this.storage.set(key, value);
        } catch {
            throw new StorageWriteError();
        }
    }
}
