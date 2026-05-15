// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Cache key used to persist the semantic model Cube semantic model.
 *
 * The trailing version segment is a cheap way to invalidate stale
 * entries when the semantic model shape changes incompatibly: bumping it to
 * `v2` makes every backend treat existing entries as a cache miss.
 */
export const CUBE_META_CACHE_KEY = 'cube:meta:semantic-model:v1';

/**
 * Injection token for the Cube semantic model cache TTL, expressed in
 * milliseconds.
 *
 * A value of `0` (or any non-positive number) means "no expiration":
 * the entry is cached indefinitely until manually invalidated.
 */
export const CUBE_META_TTL_MS = Symbol('CUBE_META_TTL_MS');
