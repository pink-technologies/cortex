// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Error thrown when parsing fails within the parser application layer.
 *
 * This error represents failures that occur within the
 * parser application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the parse layer.
 */
export class DecoderError extends Error {
    // MARK: - Properties

    /**
     * Machine-readable code for parser-layer failures.
     */
    readonly code = 'DECODER_ERROR';

    // MARK: - Constructor

    /**
     * Creates a new {@link DecoderError}.
     *
     * @param message - The human-readable error message describing the failure.
     * @param options - The options for the error.
     */
    constructor(message?: string, options?: { cause?: unknown }) {
        super(message ?? 'Decode failed', options);
    }
}