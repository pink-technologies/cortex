// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentRuntimeError } from '@/error/error';

/**
 * Thrown when an agent definition is registered with an id that already exists.
 *
 * Agent definition ids must be unique within {@link AgentDefinitionRegistry}
 * because they are used as stable lookup keys for resolution and execution.
 * This error is raised when the registry attempts to store a definition whose
 * id has already been registered.
 */
export class AgentDefinitionAlreadyRegisteredError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate agent definition registration errors.
   */
  readonly code = 'AGENT_DEFINITION_ALREADY_REGISTERED';

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate agent definition registration.
   *
   * @param agentId - The id of the agent definition that was already registered.
   * @param options - Optional error details, including the original cause.
   */
  constructor(agentId: string, options?: ErrorOptions) {
    super(`Agent definition already registered: ${agentId}`, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when an agent definition lookup completes successfully but no matching
 * definition is registered.
 *
 * This error should be used only when the lookup mechanism is working as
 * expected, but the requested definition cannot be found. Examples include an
 * unknown agent identifier, a stale reference to a definition that is no longer
 * registered, or a definition that was never registered in the current context.
 */
export class AgentDefinitionNotFoundError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for agent definition not found errors.
   */
  readonly code = 'AGENT_DEFINITION_NOT_FOUND';

  // MARK: - Constructor

  /**
   * Creates an error describing a missing agent definition.
   *
   * @param agentId - The id of the agent definition that could not be found.
   * @param options - Optional error details, including the original cause.
   */
  constructor(agentId: string, options?: ErrorOptions) {
    super(`Agent definition not found: ${agentId}`, options);
    this.name = new.target.name;
  }
}
