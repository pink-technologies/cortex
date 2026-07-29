// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { DefinitionModuleError } from '@/definitions/error/definition-module-error';

/**
 * Thrown when Cortex fails to bootstrap bundled definitions during application
 * startup.
 *
 * This error represents a high-level startup failure while registering or
 * validating definition resources such as connection types, integrations,
 * capabilities, skills, or agents. It should wrap the lower-level cause that
 * triggered the bootstrap failure so diagnostics can identify which definition
 * stage failed.
 */
export class BootstrapError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate agent id registration errors.
   */
  readonly code = 'BOOTSTRAP_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate agent registration.
   *
   * @param agentId - The id of the agent that was already registered.
   * @param options - Optional error details, including the original cause.
   */
  constructor(options?: ErrorOptions) {
    super(`Failed to bootstrap definitions`, options);
    this.name = new.target.name;
  }
}
