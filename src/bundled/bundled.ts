// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { z } from 'zod';
import { agentSchema, capabilitySchema, skillSchema } from './schemas';

/**
 * Filename → Zod schema for every bundled bundle kind.
 *
 * Used when loading bundles from a bundle tree (`BUNDLED_ROOT`).
 *
 * @property agent.toml — Agent bundle schema.
 * @property capability.toml — Capability bundle schema.
 * @property skill.toml — Skill bundle schema.
 */
export const BundledSchemas = {
    'agent.toml': agentSchema,
    'capability.toml': capabilitySchema,
    'skill.toml': skillSchema,
} as const;

/** Union of string literals in {@link BundledSchemas} key. 
 * 
*/
export type BundledFilename = keyof typeof BundledSchemas;

/** Validated bundle payload. 
 *
*/
export type BundledPayload = z.infer<
    (typeof BundledSchemas)[BundledFilename]
>;

/** Recognized bundle filenames in bundles. 
 * 
*/
export const bundledFilenames = Object.keys(
    BundledSchemas,
) as BundledFilename[];

/**
 * Type guard: `true` when `name` is a key of {@link BundledSchemas}.
 *  
 * @param name - Usually `basename(path)` for a file inside a bundle.
 * @returns True if the filename is a recognized bundle in the bundles, false otherwise.
 */
export function isBundledFilename(
    name: string,
): name is BundledFilename {
    return Object.hasOwn(BundledSchemas, name);
}
