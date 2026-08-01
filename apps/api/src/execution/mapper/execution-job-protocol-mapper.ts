// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ExecutionJob as ProtocolExecutionJob } from '@cortex/protocol'
import type { ExecutionJob } from '../models'

/**
 * Maps a domain {@link ExecutionJob} into the Cortex claim/create wire job.
 *
 * Converts dates to ISO-8601, copies wire fields explicitly, and omits
 * persistence-only properties. Status strings already match the protocol
 * literals.
 */
export class ExecutionJobProtocolMapper {
  // MARK: - Static methods

  /**
   * Creates a protocol execution job from a domain execution job.
   *
   * @param executionJob - Domain execution job to expose.
   * @returns Protocol execution-job representation.
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
      status: executionJob.status,
      updatedAt: executionJob.updatedAt.toISOString(),
      policy: {
        maximumDurationSeconds: executionJob.policy.maximumDurationSeconds,
        preserveWorkspaceOnFailure: executionJob.policy.preserveWorkspaceOnFailure,
      },
    }
  }
}
