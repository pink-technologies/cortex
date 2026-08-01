// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeApplicationError } from '../../../error/error'

/**
 * Thrown when registering this Node with the Cortex API fails.
 *
 * Raised by {@link CortexNodeResource.register}. The underlying networking
 * failure is preserved in {@link Error.cause}.
 */
export class CortexNodeRegisterError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for Node registration failures.
   */
  readonly code = 'CORTEX_NODE_REGISTER_ERROR'

  // MARK: - Constructor

  /**
   * Creates an error describing a failed Node registration.
   *
   * @param options - Optional error details, including the original cause.
   */
  constructor(options?: ErrorOptions) {
    super('Failed to register Cortex Node', options)
  }
}

/**
 * Thrown when a Node heartbeat request fails.
 *
 * Raised by {@link CortexNodeResource.heartbeat}. The underlying networking
 * failure is preserved in {@link Error.cause}.
 */
export class CortexNodeHeartbeatError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for Node heartbeat failures.
   */
  readonly code = 'CORTEX_NODE_HEARTBEAT_ERROR'

  /**
   * Node id targeted by the heartbeat.
   */
  readonly nodeId: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed Node heartbeat.
   *
   * @param nodeId - Node id targeted by the heartbeat.
   * @param options - Optional error details, including the original cause.
   */
  constructor(nodeId: string, options?: ErrorOptions) {
    super(`Failed to send Cortex Node heartbeat for ${nodeId}`, options)

    this.nodeId = nodeId
  }
}
