// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionJobStatus } from '../datatypes/execution-job-status'
import {
  ExecutionJobPolicySchema,
  type ExecutionJobPolicy,
} from './execution-job-policy'
import {
  ExecutionJobRequirementsSchema,
  type ExecutionJobRequirements,
} from './execution-job-requirements'
import {
  type ExecutionJobSource,
  type ExecutionJobSourceType,
} from './execution-job-source'
import type { ExecutionJob as ExecutionJobPersistence } from '@/infraestructure/database'

/**
 * Domain model for a persisted execution job.
 *
 * Decouples repository/API consumers from Prisma’s JSON column types by
 * schema-validating `policy` and `requirements`, mapping opaque `payload` /
 * `result` / `failure`, and reconstituting {@link ExecutionJobSource} from
 * `sourceType` / `sourceIdentifier`.
 */
export class ExecutionJob {
  // MARK: - Static methods

  /**
   * Maps a Prisma execution-job row into a domain job.
   *
   * @param record - Persisted job row.
   * @returns Domain job ready for execution consumers.
   * @throws {ZodError} When persisted `policy` or `requirements` violate their
   *   schemas.
   */
  static from(record: ExecutionJobPersistence): ExecutionJob {
    const source =
      record.sourceType == null || record.sourceIdentifier == null
        ? undefined
        : {
            identifier: record.sourceIdentifier,
            type: record.sourceType as ExecutionJobSourceType,
          }

    return new ExecutionJob(
      record.id,
      record.availableAt,
      record.createdAt,
      record.kind,
      record.maximumAttempts,
      record.priority,
      record.payload,
      record.payloadVersion,
      ExecutionJobPolicySchema.parse(record.policy),
      ExecutionJobRequirementsSchema.parse(record.requirements),
      record.status as ExecutionJobStatus,
      record.updatedAt,
      source,
      record.claimToken,
      record.claimedByNodeId,
      record.completedAt,
      record.result,
      record.failedAt,
      record.failure,
      record.runId,
      record.stepId,
    )
  }

  // MARK: - Constructor

  /**
   * Creates a domain execution job.
   *
   * @param id - Stable job primary key.
   * @param availableAt - Earliest claim time.
   * @param createdAt - Timestamp when the job row was first persisted.
   * @param kind - Handler / job-type discriminator.
   * @param maximumAttempts - Maximum attempt count before terminal failure.
   * @param priority - Queue ordering weight.
   * @param payload - Opaque job body for the handler that executes {@link kind}.
   * @param payloadVersion - Schema version of {@link payload}.
   * @param policy - Runtime execution limits and retention settings.
   * @param requirements - Worker-matching constraints.
   * @param status - Current execution-job status.
   * @param updatedAt - Timestamp when the job row was last updated.
   * @param source - Optional provenance information.
   * @param claimToken - Token issued when the job was claimed.
   * @param claimedByNodeId - Node that currently holds the claim.
   * @param completedAt - Timestamp when the job completed successfully.
   * @param result - Result produced by the execution.
   * @param failedAt - Timestamp when the job entered a terminal failure state.
   * @param failure - Sanitized failure payload persisted for the job.
   * @param runId - Optional owning workflow run primary key.
   * @param stepId - Optional owning workflow step primary key.
   */
  constructor(
    readonly id: string,
    readonly availableAt: Date,
    readonly createdAt: Date,
    readonly kind: string,
    readonly maximumAttempts: number,
    readonly priority: number,
    readonly payload: unknown,
    readonly payloadVersion: number,
    readonly policy: ExecutionJobPolicy,
    readonly requirements: ExecutionJobRequirements,
    readonly status: ExecutionJobStatus,
    readonly updatedAt: Date,
    readonly source?: ExecutionJobSource,
    readonly claimToken: string | null = null,
    readonly claimedByNodeId: string | null = null,
    readonly completedAt: Date | null = null,
    readonly result: unknown | null = null,
    readonly failedAt: Date | null = null,
    readonly failure: unknown | null = null,
    readonly runId: string | null = null,
    readonly stepId: string | null = null,
  ) {}
}
