// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type {
  NodeArchitecture,
  NodeOperatingSystem,
} from '@cortex/protocol'

/**
 * Application-layer input for registering a Cortex execution node.
 *
 * Describes the node's installation ownership, host platform, display metadata,
 * and workload-matching abilities. The repository converts these values into
 * the persistence representation of a registered node.
 */
export interface RegisterNodeParameters {
  /** Normalized CPU architecture of the node host. */
  readonly architecture: NodeArchitecture

  /** Capability identifiers offered by the node for job matching. */
  readonly capabilities: readonly string[]

  /** Stable identifier of the installation that owns the node. */
  readonly installationId: string

  /** Additional node attributes used for workload matching. */
  readonly labels: readonly string[]

  /** Human-readable name used to identify the node. */
  readonly name: string

  /** Normalized operating system of the node host. */
  readonly operatingSystem: NodeOperatingSystem

  /** Execution-job kinds the node knows how to process. */
  readonly supportedKinds: readonly string[]

  /** Optional version of the node software being registered. */
  readonly version?: string
}