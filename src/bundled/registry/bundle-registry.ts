// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { BundledPayload } from '../bundled';
import { BundleAlreadyRegisteredError } from '../error/bundle-registry.error';

/**
 * DI token for the application {@link BundleRegistry}.
 *
 * Inject with `@Inject(BUNDLE_REGISTRY)` so tests can swap the implementation.
 */
export const BUNDLE_REGISTRY = Symbol('BUNDLE_REGISTRY');

/**
 * In-memory index of validated bundle payloads keyed by {@link BundledPayload.id}
 * (from `agent.toml`, `skill.toml`, or `capability.toml`).
 *
 * Assumes bundle ids are unique across kinds; if you need the same id for different
 * kinds, use separate registries or a composite key at a higher layer.
 */
export interface BundleRegistry {
    /**
     * Returns the validated payload for `id`, or `null` if none is registered.
     */
    get(id: string): BundledPayload | null;

    /**
     * Stores a payload previously produced by {@link BundledLoader.load} (or equivalent).
     *
     * @param payload - Parsed and Zod-validated payload {@link BundledPayload.id} is the key.
     * @throws {@link BundleAlreadyRegisteredError} when that id is already registered.
     */
    register(payload: BundledPayload): void;
}

/**
 * In-memory {@link BundleRegistry} backed by a {@link Map}.
 *
 * Suitable for development, tests, or bootstrap-time registration after loading bundles from disk.
 */
export class InMemoryBundleRegistry implements BundleRegistry {
    // MARK: - Constructor

    /**
     * @param bundles - Optional pre-populated map (defaults to empty). Keys must match {@link BundledPayload.id}
     * (from `agent.toml`, `skill.toml`, or `capability.toml`).
     */
    constructor(private readonly bundles: Map<string, BundledPayload> = new Map()) { }

    /**
     * Returns the validated payload for `id`, or `null` if none is registered.
     *
     * @param id - Same value as {@link BundledPayload.id}.
     */
    get(id: string): BundledPayload | null {
        return this.bundles.get(id) ?? null;
    }

    /**
     * Registers a bundle. Must not replace an existing id.
     *
     * @param payload - Parsed and Zod-validated manifest {@link BundledPayload.id} is the key.
     * @throws {@link BundleAlreadyRegisteredError} when that id is already registered.
     */
    register(payload: BundledPayload): void {
        if (this.bundles.has(payload.id)) throw new BundleAlreadyRegisteredError();

        this.bundles.set(payload.id, payload);
    }
}
