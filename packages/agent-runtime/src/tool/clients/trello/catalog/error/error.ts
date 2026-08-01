// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all Trello client–level errors.
 *
 * This abstract error represents failures that occur within the
 * Trello client application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the Trello client layer.
 */
export abstract class TrelloClientError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * Trello client error.
   */
  abstract readonly code: string;

  // MARK: - Constructor

  /**
   * Creates a Trello client error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Standard error options, including an optional cause.
   */
  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options);

    this.name = new.target.name;
  }
}

/**
 * Error thrown when a Trello API key is not configured.
 */
export class TrelloAPIKeyNotConfiguredError extends TrelloClientError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying Trello API key not configured errors.
   */
  readonly code = 'TRELLO_API_KEY_NOT_CONFIGURED_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error for a missing Trello API key.
   */
  constructor() {
    super('Trello API key is not configured');
  }
}

/**
 * Error thrown when a Trello token is not configured.
 */
export class TrelloTokenNotConfiguredError extends TrelloClientError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying Trello token not configured errors.
   */
  readonly code = 'TRELLO_TOKEN_NOT_CONFIGURED_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error for a missing Trello token.
   */
  constructor() {
    super('Trello token is not configured');
  }
}

/**
 * Error thrown when a Trello tool runs but {@link ToolContext.trelloClient} was not set
 * (user has not linked Trello for this execution).
 */
export class TrelloClientMissingInContextError extends TrelloClientError {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying missing Trello client in context errors.
   */
  readonly code = 'TRELLO_CLIENT_MISSING_IN_CONTEXT';

  // MARK: - Constructor

  /**
   * Creates an error for a missing Trello client on the tool context.
   */
  constructor() {
    super('Trello client is missing from tool context');
  }
}
