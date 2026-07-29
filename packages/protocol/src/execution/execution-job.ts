// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { ExecutionJobPolicySchema } from './execution-job-policy'
import { ExecutionJobStatusSchema } from './execution-job-status'

/**
 * Validates the wire-level representation of an execution job.
 *
 * This strict schema defines the shared contract exchanged between API and
 * worker processes. It contains only transport-safe fields, represents dates
 * as ISO-8601 strings, and rejects unknown properties to surface protocol
 * drift immediately.
 */
export const ExecutionJobSchema = z.object({
  /** Stable, non-empty identifier of the execution job. */
  id: z.string().min(1),

  /** ISO-8601 timestamp at which the job was persisted. */
  createdAt: z.iso.datetime(),

  /**
   * Non-empty discriminator used to route the job to its execution handler.
   *
   * Examples include `"skill.run"` and `"agent.decide"`.
   */
  kind: z.string().trim().min(1),

  /** Opaque, handler-specific input supplied when the job executes. */
  payload: z.unknown(),

  /** Positive schema version used to interpret and validate {@link payload}. */
  payloadVersion: z.number().int().positive(),

  /** Integer queue weight; higher values are preferred when claiming jobs. */
  priority: z.number().int(),

  /** Runtime limits and failure-artifact retention settings. */
  policy: ExecutionJobPolicySchema,

  /** Current lifecycle state of the execution job. */
  status: ExecutionJobStatusSchema,

  /** ISO-8601 timestamp of the most recent persisted change. */
  updatedAt: z.iso.datetime(),
}).strict()

/**
 * Validated execution job exchanged through the shared protocol.
 *
 * Derived from {@link ExecutionJobSchema} so its compile-time representation
 * remains synchronized with runtime validation.
 */
export type ExecutionJob = z.infer<typeof ExecutionJobSchema>