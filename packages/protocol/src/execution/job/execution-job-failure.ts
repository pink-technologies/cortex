// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates a sanitized failure payload for an execution job.
 *
 * Carried on the wire when a Node reports that a claimed job failed, or when
 * clients read a terminal failure from the control plane. The schema is strict
 * so unknown properties fail closed and surface protocol drift between API and
 * workers.
 *
 * Stack traces, provider payloads, and other diagnostic internals are
 * intentionally excluded. Keep those in logs; expose only a stable
 * machine-readable {@link code} and a safe human-readable {@link message}.
 *
 * Field semantics:
 * - `code` — non-empty machine-readable failure identifier
 * - `message` — non-empty description safe to return to callers
 */
export const ExecutionJobFailureSchema = z
  .object({
    /**
     * Machine-readable identifier for the failure class.
     *
     * Prefer stable constants (for example handler or domain error codes) over
     * free-form strings so clients and filters can branch reliably.
     */
    code: z.string().min(1),

    /**
     * Human-readable summary of the failure.
     *
     * Must not include secrets, stack traces, or raw provider error bodies.
     */
    message: z.string().min(1),
  })
  .strict()

/**
 * Validated execution-job failure exchanged through the shared protocol.
 *
 * Derived from {@link ExecutionJobFailureSchema} so runtime validation and the
 * TypeScript representation remain synchronized.
 */
export type ExecutionJobFailure = z.infer<typeof ExecutionJobFailureSchema>
