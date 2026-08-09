// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionNode as ExecutionNodeRecord } from '@/infraestructure/database'

/**
 * Canonical CPU architecture values supported by Cortex execution nodes.
 *
 * These values match the identifiers persisted by Prisma and exchanged through
 * the node protocol.
 */
export const NodeArchitecture = {
  ARM64: 'ARM64',
  X64: 'X64',
} as const

/** A CPU architecture supported by a Cortex execution node. */
export type NodeArchitecture = (typeof NodeArchitecture)[keyof typeof NodeArchitecture]

/**
 * Canonical operating-system values supported by Cortex execution nodes.
 *
 * These values match the identifiers persisted by Prisma and exchanged through
 * the node protocol.
 */
export const NodeOperatingSystem = {
  LINUX: 'LINUX',
  MACOS: 'MACOS',
  WINDOWS: 'WINDOWS',
} as const

/** An operating system supported by a Cortex execution node. */
export type NodeOperatingSystem = (typeof NodeOperatingSystem)[keyof typeof NodeOperatingSystem]

/**
 * Canonical lifecycle states for a registered Cortex execution node.
 *
 * `ENABLED` nodes may receive work, `DISABLED` nodes are excluded from
 * scheduling, and `REVOKED` nodes are no longer trusted to participate.
 */
export const NodeState = {
  DISABLED: 'DISABLED',
  ENABLED: 'ENABLED',
  REVOKED: 'REVOKED',
} as const

/** The lifecycle state of a registered Cortex execution node. */
export type NodeState = (typeof NodeState)[keyof typeof NodeState]
  
/**
 * Domain representation of a registered Cortex execution node.
 *
 * Captures the node's stable identity, installation ownership, host platform,
 * workload-matching metadata, lifecycle state, and registration timestamps.
 */
export class ExecutionNode {
  // MARK: - Constructor

  /**
   * Creates an execution-node domain object.
   *
   * @param id - Stable server-assigned node identifier.
   * @param architecture - Normalized CPU architecture of the node host.
   * @param capabilities - Capability identifiers available for job matching.
   * @param createdAt - Timestamp when the node was first registered.
   * @param installationId - Installation that owns the node registration.
   * @param labels - Additional attributes used for workload matching.
   * @param lastSeenAt - Timestamp of the node's most recent heartbeat or activity.
   * @param name - Human-readable node name.
   * @param operatingSystem - Normalized operating system of the node host.
   * @param state - Current registration and scheduling state.
   * @param supportedKinds - Execution-job kinds the node can process.
   * @param updatedAt - Timestamp of the most recent persisted change.
   * @param version - Reported node software version, or `null` when unavailable.
   */
  constructor(
    readonly id: string,
    readonly architecture: NodeArchitecture,
    readonly capabilities: readonly string[],
    readonly createdAt: Date,
    readonly installationId: string,
    readonly labels: readonly string[],
    readonly lastSeenAt: Date,
    readonly name: string,
    readonly operatingSystem: NodeOperatingSystem,
    readonly state: NodeState,
    readonly supportedKinds: readonly string[],
    readonly updatedAt: Date,
    readonly version: string | null,
  ) {}

   // MARK: - Static Methods

  /**
   * Creates a domain {@link ExecutionJob} from a persistence record.
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