// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * `ConfigService` / `.env` key for the bundled agents directory (string).
 *
 * Use this with `config.get(BUNDLED_AGENTS_ROOT_KEY)` — not {@link BUNDLED_AGENTS_ROOT},
 * which is the Nest DI token (a `Symbol`).
 */
export const BUNDLED_AGENTS_ROOT_KEY = 'BUNDLED_AGENTS_ROOT' as const;

/**
 * Injection token for the absolute path to the bundled agents directory
 * (each subdirectory may contain `agent.toml`).
 */
export const BUNDLED_AGENTS_ROOT = Symbol(BUNDLED_AGENTS_ROOT_KEY);

/**
 * Injection token for the main assistant agent ({@link Agent}).
 */
export const AGENT = Symbol('AGENT');