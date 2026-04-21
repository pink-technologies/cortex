// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Injection token for the absolute path to the bundled capabilities directory
 * (each subdirectory may contain `capability.toml`).
 */
export const BUNDLED_CAPABILITIES_ROOT = Symbol('BUNDLED_CAPABILITIES_ROOT');