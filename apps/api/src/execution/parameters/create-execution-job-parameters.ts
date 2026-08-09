// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionJobPolicy, ExecutionJobRequirements, ExecutionJobSource } from '../models'

/**
 * Input for creating a queued `ExecutionJob` via the execution job repository.
 *
 * Maps onto the Prisma `ExecutionJob` row: `policy` / `requirements` / `payload`
 * as JSON and optional `source` as `sourceType` + `sourceIdentifier`.
 * Enqueue idempotency is not handled here; deduplication keys live on the
 * owning `WorkflowRun` (`triggerIdentifier` / `activeKey`).
 *
 * @typeParam Payload - Typed job body stored in `ExecutionJob.payload` (defaults to `unknown`).
 */
export interface CreateExecutionJobParameters<Payload = unknown> {
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
   * Optional owning {@link WorkflowRun} primary key.
   *
   * Set when the job is created from a workflow step. Nullable until historical
   * jobs are backfilled.
   */
  runId?: string

  /**
   * Optional provenance; stored as `sourceType` / `sourceIdentifier` on the row.
   */
  source?: ExecutionJobSource

  /**
   * Optional owning {@link WorkflowStep} primary key.
   *
   * Set with {@link runId} when the job belongs to a workflow step.
   */
  stepId?: string
}
