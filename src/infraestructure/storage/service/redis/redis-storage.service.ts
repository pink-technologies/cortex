// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import Redis from 'ioredis';
import type { Storage } from '../../storage';
import {
    Injectable,
    OnModuleDestroy,
} from '@nestjs/common';
import {
    StorageDeleteError,
    StorageInitializationError,
    StorageReadError,
    StorageWriteError,
} from '../error/storage-error';

/**
 * Implementation of {@link Storage} using Redis (ioredis).
 *
 * Exposes {@link read}, {@link write}, and {@link delete} methods. Values are
 * serialized/deserialized as JSON automatically.
 */
@Injectable()
export class RedisStorageService implements OnModuleDestroy, Storage {
    // MARK: - Constructor

    /**
     * Private constructor. Use {@link make} to create instances.
     *
     * @param client - Connected Redis client (ioredis).
     */
    private constructor(private readonly client: Redis) { }

    // MARK: - Static factory

    /**
     * Creates a new instance with an established connection.
     *
     * Initializes the Redis client, runs PING to verify connectivity,
     * and returns the instance ready for use.
     *
     * @param url - Redis connection URL (e.g. redis://localhost:6379).
     * @returns RedisStorageService instance ready for operations.
     * @throws {StorageInitializationError} When connection fails or PING fails.
     *
     * @example
     * ```typescript
     * const storage = await RedisStorageService.make('redis://localhost:6379');
     * await storage.write('key', { foo: 'bar' });
     * ```
     */
    static async make(url: string): Promise<RedisStorageService> {
        let client: Redis | undefined;

        try {
            client = new Redis(url);
            await client.ping();
            return new RedisStorageService(client);
        } catch {
            client?.disconnect();
            throw new StorageInitializationError();
        }
    }

    // MARK: - OnModuleDestroy

    /**
     * Closes the Redis connection when the module is destroyed.
     *
     * Invoked by NestJS when the application shuts down (graceful shutdown).
     */
    async onModuleDestroy(): Promise<void> {
        await this.client.quit();
    }

    // MARK: - Storage

    /**
     * Deletes the key from storage.
     *
     * If the key does not exist, the operation is considered successful (no error thrown).
     *
     * @param key - Key to delete.
     * @throws {StorageDeleteError} When the DEL operation fails.
     *
     * @example
     * ```typescript
     * await storage.delete('user:123');
     * ```
     */
    async delete(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch {
            throw new StorageDeleteError();
        }
    }

    /**
     * Fetches the value stored for the given key.
     *
     * If the value is valid JSON, it is deserialized to the generic type.
     * Returns `null` if the key does not exist.
     *
     * @param key - Key to query.
     * @returns Deserialized value, or `null` if key does not exist.
     * @throws {StorageReadError} When the GET operation fails.
     *
     * @example
     * ```typescript
     * const user = await storage.read<User>('user:123');
     * if (user) console.log(user.name);
     * ```
     */
    async read<T>(key: string): Promise<T | null> {
        try {
            const raw = await this.client.get(key);

            if (raw === null) return null;

            return JSON.parse(raw) as T;
        } catch {
            throw new StorageReadError();
        }
    }

    /**
     * Writes a value for the given key.
     *
     * The value is serialized with JSON.stringify (all types, including strings).
     * Stored form is therefore JSON (e.g. the string "hello" is stored as
     * "hello" with quotes). External tools reading the same key will see
     * JSON-encoded values; use read/parse for round-trip consistency.
     *
     * @param value - Value to store (must be JSON-serializable).
     * @param key - Key to store the value under.
     * @throws {StorageWriteError} When serialization or the SET operation fails.
     *
     * @example
     * ```typescript
     * await storage.write({ id: '123', name: 'John' }, 'user:123');
     * await storage.write('plain-text-token', 'session:abc');
     * ```
     */
    async write<T>(value: T, key: string): Promise<void> {
        try {
            const serialized = JSON.stringify(value);

            await this.client.set(key, serialized);
        } catch {
            throw new StorageWriteError();
        }
    }
}
