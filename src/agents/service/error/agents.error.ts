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
 * Error thrown when an attempt is made to find or act on an agent
 * that does not exist in the system.
 *
 * This typically occurs when a requested agent cannot be found
 * using its unique identifier or name.
 */
export class AgentNotFoundError extends AgentServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying agent-not-found errors.
   */
  readonly code = 'AGENT_NOT_FOUND';
}

/**
 * Error thrown when a agent operation that explicitly requires
 * a agent identifier is invoked without one.
 *
 * This typically happens when the caller passes an empty string
 * or undefined to a service method that expects an ID.
 */
export class AgentRequiredIdError extends AgentServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying missing agent ID errors.
   */
  readonly code = 'AGENT_REQUIRED_ID';
}

/**
 * Error thrown when an intent (by slug) does not exist in the system.
 *
 * This typically occurs when the requested intent slug has no matching
 * {@link Intent} record in the database.
 */
export class IntentNotFoundError extends AgentServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying intent not found errors.
   */
  readonly code = 'INTENT_NOT_FOUND';
}

/**
 * Error thrown when an attempt is made to find or act on an agent
 * intent that does not exist in the system.
 *
 * This typically occurs when a requested agent intent cannot be found
 * using its unique identifier or name.
 */
export class AgentIntentNotFoundError extends AgentServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying agent intent not found errors.
   */
  readonly code = 'AGENT_INTENT_NOT_FOUND';
}

/**
 * Error thrown when {@link AgentRunService.run} is called without a chat id
 * (empty or whitespace).
 */
export class ChatRequiredIdError extends AgentServiceError {
  readonly code = 'CHAT_REQUIRED_ID';
}

/**
 * Error thrown when an attempt is made to run an agent in a chat
 * that does not exist in the system.
 */
export class ChatNotFoundError extends AgentServiceError {
  readonly code = 'CHAT_NOT_FOUND';
}
