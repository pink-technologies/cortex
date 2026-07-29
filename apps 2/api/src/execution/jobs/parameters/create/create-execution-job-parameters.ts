// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { 
    ExecutionJobPolicy,
    ExecutionJobRequirements,
    ExecutionJobSource
} from "../../models"

/**
 * Input for creating a queued `ExecutionJob` via the execution job repository.
 *
 * Maps onto the Prisma `ExecutionJob` row: `policy` / `requirements` / `payload` as JSON,
 * optional `source` as `sourceType` + `sourceIdentifier`, and uniqueness for
 * `activeKey` / `triggerIdentifier` when set.
 *
 * @typeParam Payload - Typed job body stored in `ExecutionJob.payload` (defaults to `unknown`).
 */
export interface CreateExecutionJobParameters<Payload = unknown> {
  /**
   * When set, at most one non-terminal job may hold this key (`ExecutionJob.activeKey`, unique).
   * Useful for “replace or skip if already running” semantics.
   */
  activeKey?: string

  /**
   * Earliest time the job may be claimed from the queue. Defaults to now when omitted.
   */
  availableAt?: Date

  /**
   * Handler / job-type discriminator (for example `"skill.run"`, `"agent.decide"`).
   * Indexes and workers route on this field.
   */
  kind: string

  /**
   * Maximum attempt count before the job is marked failed. Defaults to `1` in the schema.
   */
  maximumAttempts?: number

  /**
   * Opaque job body passed to the handler that executes {@link kind}.
   */
  payload: Payload

  /**
   * Schema version of {@link payload}. Defaults to `1` when omitted.
   */
  payloadVersion?: number

  /**
   * Queue ordering weight; higher values are preferred when claiming ready jobs.
   * Defaults to `0`.
   */
  priority: number

  /**
   * Execution limits and failure-retention settings.
   */
  policy: ExecutionJobPolicy

  /**
   * Constraints used to match a suitable worker.
   */
  requirements: ExecutionJobRequirements

  /**
   * Optional provenance; stored as `sourceType` / `sourceIdentifier` on the row.
   */
  source?: ExecutionJobSource

  /**
   * Idempotency key for enqueue (`ExecutionJob.triggerIdentifier`, unique).
   * Re-submitting the same value should not create a duplicate job.
   */
  triggerIdentifier?: string
}
