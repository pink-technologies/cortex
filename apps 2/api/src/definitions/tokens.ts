// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Injection token for the absolute path to the bundled agents directory
 * (each subdirectory may contain `agent.toml`).
 */
export const BUNDLED_AGENTS_PATH = Symbol('BUNDLED_AGENTS_PATH');

/**
 * Injection token for the absolute path to the bundled capabilities directory
 * (each subdirectory may contain `capability.toml`).
 */
export const BUNDLED_CAPABILITIES_PATH = Symbol('BUNDLED_CAPABILITIES_PATH');

/**
 * Injection token for the absolute path to the bundled skills directory
 * (each subdirectory may contain `skill.toml`).
 */
export const BUNDLED_SKILLS_PATH = Symbol('BUNDLED_SKILLS_PATH');
