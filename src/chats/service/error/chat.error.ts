// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all chat service–level errors.
 *
 * This abstract error represents failures that occur within the
 * chat application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class ChatServiceError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * chat service error.
   */
  abstract readonly code: string;
}

/**
 * Error thrown when an attempt is made to find a chat
 * that does not exist in the system.
 */
export class ChatNotFoundError extends ChatServiceError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying chat-not-found errors.
   */
  readonly code = 'CHAT_NOT_FOUND';
}
