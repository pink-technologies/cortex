// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Injection token for the absolute path to the bundled agents directory
 * (each subdirectory may contain `agent.toml`).
 */
export const AGENTS_BUNDLED_ROOT = Symbol('AGENTS_BUNDLED_ROOT');
