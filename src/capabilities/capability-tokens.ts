// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * `ConfigService` / `.env` key for the bundled capabilities directory (string).
 *
 * Use this with `config.get(BUNDLED_CAPABILITIES_PATH_KEY)` — not {@link BUNDLED_CAPABILITIES_PATH},
 * which is the Nest DI token (a `Symbol`).
 */
export const BUNDLED_CAPABILITIES_PATH_KEY = 'BUNDLED_CAPABILITIES_PATH' as const;

/**
 * Injection token for the absolute path to the bundled agents directory
 * (each subdirectory may contain `agent.toml`).
 */
export const BUNDLED_CAPABILITIES_PATH = Symbol(BUNDLED_CAPABILITIES_PATH_KEY);