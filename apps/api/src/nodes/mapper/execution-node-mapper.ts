// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionNode } from '../models/execution-node'
import { ExecutionNode as ExecutionNodeRecord } from '@/infraestructure/database'

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
export class ExecutionNodeMapper {
  // MARK: - Static Methods

  /**
   * Creates a domain {@link ExecutionJob} from a Prisma persistence record.
   *
   * @param record - Database row for the job.
   * @returns A domain-level execution job.
   */
  static from(record: ExecutionNodeRecord): ExecutionNode {
    return new ExecutionNode(
      record.id,
      record.architecture,
      [...record.capabilities],
      record.createdAt,
      record.installationId,
      [...record.labels],
      record.lastSeenAt,
      record.name,
      record.operatingSystem,
      record.state,
      [...record.supportedKinds],
      record.updatedAt,
      record.version,
    )
  }
}
