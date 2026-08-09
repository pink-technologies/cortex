// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Canonical CPU architecture identifiers used by the Cortex node protocol.
 *
 * Use these constants when constructing registration payloads or comparing
 * validated architecture values:
 *
 * - `ARM64` — 64-bit ARM architecture, including Apple Silicon.
 * - `X64` — 64-bit x86 architecture.
 */
export const NodeArchitecture = {
  ARM64: 'ARM64',
  X64: 'X64',
} as const

/**
 * Validates CPU architectures supported by Cortex execution nodes.
 *
 * - `ARM64` — 64-bit ARM architecture, including Apple Silicon.
 * - `X64` — 64-bit x86 architecture.
 *
 * These wire-level values are platform-neutral and should be mapped from the
 * host runtime's architecture identifier during node registration.
 */
export const NodeArchitectureSchema = z.enum([
  NodeArchitecture.ARM64,
  NodeArchitecture.X64,
])

/**
 * Validated CPU architecture advertised by a Cortex node.
 *
 * Derived from {@link NodeArchitectureSchema} so runtime validation and the
 * TypeScript union remain synchronized.
 */
export type NodeArchitecture = z.infer<typeof NodeArchitectureSchema>