// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all tool service–level errors.
 *
 * This abstract error represents failures that occur within the
 * tool application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class ToolServiceError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * tool service error.
     */
    abstract readonly code: string;
}

/**
 * Error thrown when an attempt is made to find or act on a tool
 * that does not exist in the system.
 */
export class ToolNotFoundError extends ToolServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying tool-not-found errors.
     */
    readonly code = 'TOOL_NOT_FOUND';
}

/**
 * Error thrown when a tool operation that requires a tool slug
 * is invoked with an empty or whitespace-only slug.
 *
 * This typically happens when the caller passes an empty string
 * or only spaces to a service method that expects a slug (e.g. isToolRegistered).
 */
export class ToolRequiredSlugError extends ToolServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying missing tool slug errors.
     */
    readonly code = 'TOOL_REQUIRED_SLUG';
}

/**
 * Error thrown when a tool operation that requires a tool slug
 * is invoked with an empty or whitespace-only slug.
 *
 * This typically happens when the caller passes an empty string
 * or only spaces to a service method that expects a slug (e.g. isToolRegistered).
 */
export class ToolAlreadyRegisteredError extends ToolServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying missing tool slug errors.
     */
    readonly code = 'TOOL_ALREADY_REGISTERED';
}