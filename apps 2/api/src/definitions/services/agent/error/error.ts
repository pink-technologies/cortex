// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { DefinitionModuleError } from '@/definitions/error/definition-module-error';

/**
 * Thrown when an agent is registered with an id that already exists.
 *
 * Agent ids must be unique within the current ecosystem because they are used
 * as stable lookup keys for routing, delegation, and agent resolution. This
 * error is raised when the service attempts to register an agent whose id has
 * already been stored.
 *
 * This usually indicates an invalid bundled-agent configuration, where two or
 * more agent manifests declare the same `id`.
 */
export class AgentAlreadyRegisteredError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate agent id registration errors.
   */
  readonly code = 'AGENT_ALREADY_REGISTERED';

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate agent registration.
   *
   * @param agentId - The id of the agent that was already registered.
   * @param options - Optional error details, including the original cause.
   */
  constructor(agentId: string, options?: ErrorOptions) {
    super(`Agent already registered: ${agentId}`, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when an agent definition cannot be loaded or registered from the
 * configured file-system source.
 *
 * This error is used to wrap failures that occur while processing bundled agent
 * definitions, including file read failures, invalid manifests, prompt loading
 * errors, duplicate registrations, or unexpected errors raised while storing the
 * loaded agent.
 */
export class AgentLoadError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for agent load errors.
   */
  readonly code = 'AGENT_LOAD_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a failure while retrieving the MAIN agent.
   *
   * @param message - A description of the retrieval failure.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when an agent lookup completes successfully but no matching agent is
 * registered in the agent module.
 *
 * This error should be used only when the lookup mechanism is working as
 * expected, but the requested agent cannot be found. Examples include a missing
 * MAIN orchestrator agent, an unknown delegated agent identifier, or a stale
 * reference to an agent that is no longer registered.
 */
export class AgentNotFoundError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for agent load errors.
   */
  readonly code = 'AGENT_NOT_FOUND_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a failure while retrieving the details of an agent.
   *
   * @param message - A description of the retrieval failure.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown for agent-definition–layer failures that are not a dedicated load,
 * duplicate registration, not-found, or MAIN-agent specific case.
 *
 * Prefer the narrower errors in this module when the failure mode is known; use
 * this type for infrastructure or unexpected errors from agent definition services
 * (for example storage failures when resolving an agent outside the explicit
 * registration or lookup paths).
 */
export class AgentServiceError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for generic agent service errors.
   */
  readonly code = 'AGENT_SERVICE_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing an agent definitions service failure.
   *
   * @param message - Human-readable description of what went wrong.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when retrieving the MAIN orchestrator agent fails due to an unexpected
 * storage or infrastructure error.
 *
 * This error should be used only when the main agent lookup fails for reasons
 * other than the agent being absent. Examples include storage driver failures,
 * I/O errors, serialization issues, or unexpected exceptions raised by
 * `Storage.read`.
 */
export class FailedToGetMainAgentError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for invalid agent role errors.
   * A machine-readable error code identifying the type of
   * agent service error.
   */
  readonly code = 'FAILED_TO_GET_MAIN_AGENT_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a failure while retrieving the MAIN agent.
   *
   * @param message - A description of the retrieval failure.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when more than one MAIN agent is registered for the same ecosystem.
 *
 * The runtime expects a single MAIN agent to act as the orchestrator for agent
 * execution. This error is raised when another agent with the MAIN role is
 * discovered after a MAIN agent has already been registered.
 *
 * This usually indicates an invalid bundled-agent configuration, where two or
 * more agent manifests declare `role = "main"`.
 */
export class DuplicateMainAgentError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate MAIN agent errors.
   */
  readonly code = 'DUPLICATE_MAIN_AGENT';

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate MAIN agent registration.
   *
   * @param agentId - The id of the agent that attempted to register as MAIN.
   * @param options - Optional error details, including the original cause.
   */
  constructor(agentId: string, options?: ErrorOptions) {
    super(`Duplicate main agent: ${agentId}`, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when no MAIN orchestrator agent is registered or available.
 *
 * This error represents an expected domain failure where the system cannot find
 * the agent responsible for coordinating execution. It can occur when no agent
 * with the MAIN role was loaded, when the main agent id was not stored, or when
 * the stored main agent id points to an agent that no longer exists.
 */
export class MainAgentNotFoundError extends DefinitionModuleError {
  /**
   * Machine-readable code for invalid agent role errors.
   * A machine-readable error code identifying the type of
   * agent service error.
   */
  readonly code = 'MAIN_AGENT_NOT_FOUND';

  // MARK: - Constructor

  /**
   * Creates an error describing an unexpected failure while retrieving the MAIN agent.
   *
   * Use this error when the MAIN agent lookup fails because of storage,
   * serialization, or infrastructure issues rather than because the MAIN agent is
   * missing.
   *
   * @param message - A description of the retrieval failure.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message = 'Failed to get main agent', options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
