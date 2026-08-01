// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionJobStatus } from '../datatypes/execution-job-status'
import { ExecutionJobPolicy } from './execution-job-policy'
import { ExecutionJobRequirements } from './execution-job-requirements'
import { ExecutionJobSource } from './execution-job-source'

/**
 * Domain model for a persisted execution job.
 *
 * Decouples repository/API consumers from Prisma’s JSON column types by casting
 * `payload`, `policy`, `requirements`, `result`, and `failure` into their
 * application shapes, and by reconstituting {@link ExecutionJobSource} from
 * `sourceType` / `sourceIdentifier`.
 */
export class ExecutionJob {
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
   * @param triggerIdentifier - Optional enqueue idempotency key.
   * @param activeKey - Optional uniqueness key for concurrent jobs.
   * @param claimToken - Token issued when the job was claimed.
   * @param claimedByNodeId - Node that currently holds the claim.
   * @param completedAt - Timestamp when the job completed successfully.
   * @param result - Result produced by the execution.
   * @param failedAt - Timestamp when the job entered a terminal failure state.
   * @param failure - Sanitized failure payload persisted for the job.
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
    readonly triggerIdentifier?: string | null,
    readonly activeKey?: string | null,
    readonly claimToken: string | null = null,
    readonly claimedByNodeId: string | null = null,
    readonly completedAt: Date | null = null,
    readonly result: unknown | null = null,
    readonly failedAt: Date | null = null,
    readonly failure: unknown | null = null,
  ) {}
}
