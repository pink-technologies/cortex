// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Injection token for the absolute path to the bundled agents directory
 * (each subdirectory may contain `agent.toml`).
 */
export const BUNDLED_AGENTS_PATH = Symbol('BUNDLED_AGENTS_PATH')

/**
 * Injection token for the main runtime {@link Agent} used by the kernel.
 */
export const AGENT = Symbol('AGENT')