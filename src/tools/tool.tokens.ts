// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Injection token for the absolute path to the bundled tools directory
 * (each subdirectory may contain `tool.toml`).
 */
export const TOOLS_BUNDLED_ROOT = Symbol('TOOLS_BUNDLED_ROOT');