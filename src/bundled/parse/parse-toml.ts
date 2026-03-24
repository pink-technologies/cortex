// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import * as TOML from '@iarna/toml';

/**
 * Parses a TOML string into a TOML object.
 *
 * @param toml - The TOML string to parse.
 * @returns The parsed TOML payload.
 */
export function parseToml(toml: string): unknown {
    return TOML.parse(toml);
}