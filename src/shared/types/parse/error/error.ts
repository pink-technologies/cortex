// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all parse errors.
 *
 * This abstract error represents failures that occur within the
 * parse application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the parse layer.
 */
export abstract class ParseError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * parse error.
     */
    abstract readonly code: string;
}

/**
 * Thrown when a TOML string cannot be parsed.
 *
 * Use this to avoid parsing errors.
 */
export class TomlParseError extends ParseError {
    // MARK: - Properties

    /**
     * Machine-readable code for TOML parse errors.
     */
    readonly code = 'TOML_PARSE_ERROR';
}