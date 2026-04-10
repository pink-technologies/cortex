// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Shared in-process registry storage (agents, skills, capability executors).
 *
 * Backed by {@link InMemoryStorageService} so non-JSON values (class instances,
 * functions) survive round-trips. Not suitable for cross-process persistence.
 */
export const STORAGE = Symbol('STORAGE');
