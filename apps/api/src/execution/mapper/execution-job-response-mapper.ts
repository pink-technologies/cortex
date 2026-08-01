// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { GetExecutionJobResponse, GetExecutionJobResponseSchema } from '@cortex/protocol'
import type { ExecutionJob } from '../models'

/**
 * Maps a domain {@link ExecutionJob} into the Cortex HTTP protocol.
 *
 * This mapper defines the boundary between the API's internal execution-job
 * model and the representation transmitted to Cortex Nodes.
 */
export class ExecutionJobResponseMapper {
  // MARK: - Static Methods

  /**
   * Creates a protocol response from a domain execution job.
   *
   * Dates are converted to ISO-8601 strings, nested values are copied
   * explicitly, and persistence-only properties are omitted.
   *
   * @param executionJob - The domain execution job to expose.
   * @returns The corresponding execution-job protocol response.
   */
  static from(executionJob: ExecutionJob): GetExecutionJobResponse {
    return GetExecutionJobResponseSchema.parse({
      id: executionJob.id,
      completedAt: executionJob.completedAt?.toISOString() ?? null,
      createdAt: executionJob.createdAt.toISOString(),
      failedAt: executionJob.failedAt?.toISOString() ?? null,
      failure: executionJob.failure,
      kind: executionJob.kind,
      result: executionJob.result,
      status: executionJob.status,
    })
  }
}
