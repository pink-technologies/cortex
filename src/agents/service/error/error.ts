// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all agent service–level errors.
 *
 * This abstract error represents failures that occur within the
 * agent application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class AgentServiceError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * agent service error.
   */
  abstract readonly code: string;
}

/**
 * Thrown when an agent registration is attempted but the agent (or its identifier)
 * is already registered in the system.
 *
 * Use this to avoid duplicate registrations or conflicting agent identity in the registry.
 */
export class AgentAlreadyRegisteredError extends AgentServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate agent registration errors.
   */
  readonly code = 'AGENT_ALREADY_REGISTERED';
}

/**
 * Thrown when an agent fails to load from a file.
 */
export class AgentFileLoadError extends AgentServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for agent load errors.
   */
  readonly code = 'AGENT_FILE_LOAD_ERROR';
}