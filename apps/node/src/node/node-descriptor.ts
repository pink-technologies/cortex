// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeArchitecture, NodeOperatingSystem } from "@cortex/protocol"

/**
 * Immutable identity and workload-matching metadata advertised by a Cortex
 * execution node.
 *
 * The polling service includes these values in claim requests so the API can
 * select jobs whose kind and requirements are compatible with the node.
 */
export interface NodeDescriptor {
  /**
   * CPU architecture of the node.
   */
  readonly architecture: NodeArchitecture

  /**
   * Capability identifiers currently provided by the node.
   *
   * Compared with a job's `allOf`, `anyOf`, and `noneOf` requirements.
   */
  readonly capabilities: string[]

  /**
   * Node attributes used for matching, such as platform, architecture, or pool.
   */
  readonly labels: string[]

  /**
   * Operating system of the node.
   */
  readonly operatingSystem: NodeOperatingSystem

  /**
   * Execution-job kinds this node knows how to process.
   */
  readonly supportedKinds: string[]
}