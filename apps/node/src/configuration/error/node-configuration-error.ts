// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeApplicationError } from '../../error/error'

/**
 * Thrown when Cortex Node TOML configuration cannot be loaded or validated.
 *
 * Messages must never include tokens, API keys, or other resolved secret values.
 */
export class NodeConfigurationError extends NodeApplicationError {
  // MARK: - Properties

  /**
   * Machine-readable code for Node configuration failures.
   */
  readonly code = 'NODE_CONFIGURATION_INVALID'

  // MARK: - Constructor

  /**
   * Creates a configuration error.
   *
   * @param message - Failure summary without secret values.
   * @param options - Optional underlying cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}
