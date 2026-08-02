// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionJobResponseSchema, type ExecutionJobResponse } from '@cortex/protocol'
import type { ExecutionJob } from '../models'

/**
 * Maps a domain {@link ExecutionJob} into the public GET execution-job response.
 *
 * Converts dates to ISO-8601, selects the read-model fields, and validates the
 * result against {@link ExecutionJobResponseSchema}.
 */
export class ExecutionJobResponseMapper {
  // MARK: - Static methods

  /**
   * Creates a protocol response from a domain execution job.
   *
   * @param executionJob - Domain execution job to expose.
   * @returns Validated GET execution-job response.
   */
  static from(executionJob: ExecutionJob): ExecutionJobResponse {
    return ExecutionJobResponseSchema.parse({
      id: executionJob.id,
      completedAt: executionJob.completedAt?.toISOString() ?? null,
      createdAt: executionJob.createdAt.toISOString(),
      failedAt: executionJob.failedAt?.toISOString() ?? null,
      failure: executionJob.failure,
      kind: executionJob.kind,
      result: executionJob.result,
      runId: executionJob.runId,
      status: executionJob.status,
    })
  }
}
