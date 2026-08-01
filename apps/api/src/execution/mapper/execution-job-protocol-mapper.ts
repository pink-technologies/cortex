// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionJob } from '../models'
import { ExecutionJobStatus } from '../datatypes/execution-job-status'
import {
  type ExecutionJob as ProtocolExecutionJob,
  type ExecutionJobStatus as ProtocolExecutionJobStatus,
} from '@cortex/protocol'

/**
 * Maps a domain {@link ExecutionJob} into the Cortex claim/create protocol job.
 *
 * This mapper defines the boundary between the API's internal execution-job
 * model and the full wire representation transmitted to Cortex Nodes when
 * claiming or acknowledging enqueue.
 */
export class ExecutionJobProtocolMapper {
  // MARK: - Static Methods

  /**
   * Creates a protocol execution job from a domain execution job.
   *
   * Dates are converted to ISO-8601 strings, nested values are copied
   * explicitly, and persistence-only properties are omitted.
   *
   * @param executionJob - The domain execution job to expose.
   * @returns The corresponding execution-job protocol representation.
   */
  static from(executionJob: ExecutionJob): ProtocolExecutionJob {
    return {
      id: executionJob.id,
      claimToken: executionJob.claimToken,
      createdAt: executionJob.createdAt.toISOString(),
      kind: executionJob.kind,
      payload: executionJob.payload,
      payloadVersion: executionJob.payloadVersion,
      priority: executionJob.priority,
      status: ExecutionJobProtocolMapper.mapStatus(executionJob.status),
      updatedAt: executionJob.updatedAt.toISOString(),
      policy: {
        maximumDurationSeconds: executionJob.policy.maximumDurationSeconds,
        preserveWorkspaceOnFailure:
          executionJob.policy.preserveWorkspaceOnFailure,
      },
    }
  }

  // MARK: - Private Methods

  private static mapStatus(
    status: ExecutionJobStatus,
  ): ProtocolExecutionJobStatus {
    switch (status) {
      case ExecutionJobStatus.AWAITING_REVIEW:
        return 'AWAITING_REVIEW'

      case ExecutionJobStatus.CANCELLED:
        return 'CANCELLED'

      case ExecutionJobStatus.COMPLETED:
        return 'COMPLETED'

      case ExecutionJobStatus.FAILED:
        return 'FAILED'

      case ExecutionJobStatus.INTERRUPTED:
        return 'INTERRUPTED'

      case ExecutionJobStatus.QUEUED:
        return 'QUEUED'

      case ExecutionJobStatus.RUNNING:
        return 'RUNNING'

      default:
        throw new Error(`Unknown execution job status: ${status}`)
    }
  }
}
