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
}

/**
 * Error thrown when an attempt is made to create a card in Trello
 * but the request fails.
 */
export class TrelloCardCreationError extends TrelloClientError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying Trello card creation errors.
     */
    readonly code = 'TRELLO_CARD_CREATION_ERROR';
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
}