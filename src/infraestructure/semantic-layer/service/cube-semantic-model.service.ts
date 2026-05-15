// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CubeSemanticLayerApiClient } from '../cube/cube-api.client';
import { STORAGE, type Storage } from '@/infraestructure/storage';
import { semanticModel } from '../cube/cube-semantic-model';
import {
    CUBE_META_CACHE_KEY,
    CUBE_META_TTL_MS,
} from '../cube/cube-semantic-model.constants';
import {
    type CubeSemanticModel,
    type CubeSemanticModelCacheEntry,
} from '../types/cube';

/**
 * Cache-aside service for the Cube semantic model.
 *
 * Acts as the single read path between {@link CubeAnalyticsCapabilityExecutor}
 * and the Cube API client. Responsibilities are intentionally narrow:
 *
 * 1. Fetch the live meta from Cube and delegate the shape projection to
 *    {@link projectCubeSemanticModel} (pure function, unit-testable).
 * 2. Persist the projection in the shared {@link STORAGE} with a TTL so
 *    repeated agent turns do not hammer the Cube `meta` endpoint.
 * 3. Pre-warm the cache on boot so the first user request hits a warm cache.
 *
 * Cache failures never bubble up: they are logged via the NestJS
 * {@link Logger} and the call falls back to a live fetch.
 */
@Injectable()
export class CubeSemanticModelService implements OnModuleInit {
    // MARK: - Properties

    /**
     * In-flight `getSemanticModel` promise, used to coalesce concurrent
     * cache misses into a single Cube `fetchMeta` round-trip.
     */
    private pendingRefresh: Promise<CubeSemanticModel> | null = null;

    // MARK: - Constructor

    constructor(
        private readonly client: CubeSemanticLayerApiClient,
        @Inject(STORAGE) private readonly storage: Storage,
        @Inject(CUBE_META_TTL_MS) private readonly ttlMs: number,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Pre-loads the projection at boot. Failures are logged but never
     * thrown: a failing warm-up must not prevent the app from starting,
     * the cache will simply be filled lazily on first request.
     */
    async onModuleInit(): Promise<void> {
        await this.getSemanticModel();
    }

    // MARK: - Methods

    /**
     * Returns the projected Cube semantic model, hitting the cache first
     * and falling back to a live fetch on miss.
     *
     * Concurrent calls during a cache miss are deduplicated through an
     * in-flight promise so we never issue more than one `fetchMeta`
     * round-trip at a time.
     */
    async getSemanticModel(): Promise<CubeSemanticModel> {
        const cached = await this.readCache();

        if (cached !== null) {
            return cached;
        }

        if (this.pendingRefresh !== null) {
            return this.pendingRefresh;
        }

        this.pendingRefresh = this.refresh().finally(() => {
            this.pendingRefresh = null;
        });

        return this.pendingRefresh;
    }

    /**
     * Bypasses the cache, fetches a fresh projection from Cube, writes
     * it to storage and returns it. Shared internally by the lazy
     * cache-miss path and exposed for admin-style refresh endpoints.
     */
    async refresh(): Promise<CubeSemanticModel> {
        const meta = await this.client.fetchMeta();
        const model = semanticModel(meta);

        const entry: CubeSemanticModelCacheEntry = {
            expiresAt: this.ttlMs > 0 ? Date.now() + this.ttlMs : null,
            semanticModel: model,
        };

        await this.storage.write(entry, CUBE_META_CACHE_KEY);

        return model;
    }

    // Mark: Private methods

    private async readCache(): Promise<CubeSemanticModel | null> {
        const entry = await this.storage.read<CubeSemanticModelCacheEntry>(CUBE_META_CACHE_KEY);

        if (!entry || !this.validCacheEntry(entry)) {
            return null;
        }


        if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
            await this.storage.delete(CUBE_META_CACHE_KEY).catch(() => undefined);

            return null;
        }

        return entry.semanticModel;
    }

    private validCacheEntry(value: unknown): value is CubeSemanticModelCacheEntry {
        if (typeof value !== 'object' || value === null) return false;

        const candidate = value as Partial<CubeSemanticModelCacheEntry>;


        const validExpiry = candidate.expiresAt === null || typeof candidate.expiresAt === 'number';

        const validSemanticModel = typeof candidate.semanticModel === 'object' && candidate.semanticModel !== null;

        return validExpiry && validSemanticModel;
    }
}
