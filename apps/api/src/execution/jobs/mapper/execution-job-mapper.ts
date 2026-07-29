// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JobStatus } from '@prisma/client';
import {
  ExecutionJob,
  ExecutionJobPolicy,
  ExecutionJobRequirements,
  ExecutionJobSource,
} from '../models';

import {
  ExecutionJob as ExecutionJobRecord,
  ExecutionJobStatus,
  ExecutionJobStatus as DatabaseExecutionJobStatus,
} from '@/infraestructure/database';

/**
 * Translates Prisma execution-job records into domain {@link ExecutionJob}
 * instances.
 *
 * The mapper is the persistence boundary for execution jobs. It converts
 * Prisma JSON fields to their domain representations, maps the generated
 * Prisma status enum to the application status enum, and reconstructs the
 * optional source value stored across `sourceType` and `sourceIdentifier`.
 *
 * This class is stateless and is not intended to be instantiated.
 */
export class ExecutionJobMapper {
  // MARK: - Static Methods

  /**
   * Creates a domain {@link ExecutionJob} from a Prisma persistence record.
   *
   * @param record - Database row for the job.
   * @returns A domain-level execution job.
   */
  static from(record: ExecutionJobRecord): ExecutionJob {
    return new ExecutionJob(
      record.id,
      record.availableAt,
      record.createdAt,
      record.kind,
      record.maximumAttempts,
      record.priority,
      record.payload,
      record.payloadVersion,
      record.policy as unknown as ExecutionJobPolicy,
      record.requirements as unknown as ExecutionJobRequirements,
      ExecutionJobMapper.mapStatus(record.status),
      record.updatedAt,
      ExecutionJobMapper.mapSource(record),
      record.triggerIdentifier,
      record.activeKey,
    );
  }

  // MARK: - Private methods

  private static mapStatus(
    status: DatabaseExecutionJobStatus,
  ): ExecutionJobStatus {
    switch (status) {
      case DatabaseExecutionJobStatus.AWAITING_REVIEW:
        return ExecutionJobStatus.AWAITING_REVIEW;

      case DatabaseExecutionJobStatus.CANCELLED:
        return ExecutionJobStatus.CANCELLED;

      case DatabaseExecutionJobStatus.COMPLETED:
        return ExecutionJobStatus.COMPLETED;

      case DatabaseExecutionJobStatus.FAILED:
        return ExecutionJobStatus.FAILED;

      case DatabaseExecutionJobStatus.INTERRUPTED:
        return ExecutionJobStatus.INTERRUPTED;

      case JobStatus.QUEUED:
        return ExecutionJobStatus.QUEUED;

      case JobStatus.RUNNING:
        return ExecutionJobStatus.RUNNING;
    }
  }

  private static mapSource(
    record: Pick<ExecutionJobRecord, 'sourceType' | 'sourceIdentifier'>,
  ): ExecutionJobSource | undefined {
    if (record.sourceType == null || record.sourceIdentifier == null) {
      return undefined;
    }

    return {
      type: record.sourceType,
      identifier: record.sourceIdentifier,
    };
  }
}
