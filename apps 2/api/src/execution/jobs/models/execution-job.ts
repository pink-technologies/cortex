// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionJobStatus } from '../../datatypes/execution-job-status'
import type {
  ExecutionJobPolicy,
  ExecutionJobRequirements,
  ExecutionJobSource,
} from './'

/**
 * Domain model for a persisted execution job.
 *
 * Decouples repository/API consumers from Prisma’s JSON column types by casting
 * `payload`, `policy`, and `requirements` into their application shapes, and by
 * reconstituting {@link ExecutionJobSource} from `sourceType` / `sourceIdentifier`.
 */
export class ExecutionJob {
  // MARK: - Constructor

  /**
   * Creates a domain execution job.
   *
   * @param id - Stable job primary key.
   * @param createdAt - Timestamp when the job row was first persisted.
   * @param kind - Handler / job-type discriminator.
   * @param priority - Queue ordering weight.
   * @param payload - Opaque job body for the handler that executes {@link kind}.
   * @param payloadVersion - Schema version of {@link payload}.
   * @param policy - Runtime execution limits and retention settings.
   * @param requirements - Worker-matching constraints.
   * @param updatedAt - Timestamp when the job row was last updated.
   * @param source - Optional provenance (`sourceType` / `sourceIdentifier` on the row).
   * @param triggerIdentifier - Optional enqueue idempotency key.
   * @param activeKey - Optional uniqueness key for concurrent/active jobs.
   * @param availableAt - Earliest claim time.
   * @param maximumAttempts - Maximum attempt count before terminal failure.
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
  ) {}
}
