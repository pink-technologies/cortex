// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Environment-variable name accepted by secret references.
 *
 * Must be a nonblank identifier suitable for `process.env` lookup.
 */
export const EnvironmentVariableNameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[A-Za-z_][A-Za-z0-9_]*$/,
    'Secret environment variable names must be valid identifiers.',
  )

/**
 * Secret reference accepted in Node TOML configuration.
 *
 * Currently only environment variables are supported. When a second source is
 * added, convert this to a discriminated union on `source`.
 */
export const SecretReferenceSchema = z
  .object({
    name: EnvironmentVariableNameSchema,
    source: z.literal('environment'),
  })
  .strict()

/**
 * Parsed secret reference from TOML configuration.
 */
export type SecretReference = z.infer<typeof SecretReferenceSchema>
