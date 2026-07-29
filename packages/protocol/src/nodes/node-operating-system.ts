// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Canonical operating-system identifiers used by the Cortex node protocol.
 *
 * Use these constants when constructing registration payloads or comparing
 * validated operating-system values:
 *
 * - `LINUX` — Linux-based hosts.
 * - `MACOS` — Apple macOS hosts.
 * - `WINDOWS` — Microsoft Windows hosts.
 */
export const NodeOperatingSystem = {
  LINUX: 'LINUX',
  MACOS: 'MACOS',
  WINDOWS: 'WINDOWS',
} as const

/**
 * Validates operating systems supported by Cortex execution nodes.
 *
 * The normalized protocol values are independent of runtime-specific names
 * such as Node.js `process.platform`.
 *
 * - `LINUX` — Linux-based hosts.
 * - `MACOS` — Apple macOS hosts.
 * - `WINDOWS` — Microsoft Windows hosts.
 */
export const NodeOperatingSystemSchema = z.enum([
  NodeOperatingSystem.LINUX,
  NodeOperatingSystem.MACOS,
  NodeOperatingSystem.WINDOWS,
])

/**
 * Validated operating system advertised by a Cortex node.
 *
 * Derived from {@link NodeOperatingSystemSchema} so runtime validation and the
 * TypeScript union remain synchronized.
 */
export type NodeOperatingSystem = z.infer<typeof NodeOperatingSystemSchema>