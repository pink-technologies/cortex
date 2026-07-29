// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all definition module errors.
 *
 * This abstract error represents failures that occur while loading, registering,
 * validating, or resolving bundled Cortex definitions, such as agents, skills,
 * capabilities, integrations, and connection types.
 *
 * `DefinitionModuleError` acts as the boundary between the definition registry
 * layer and transport-level concerns such as HTTP or GraphQL. Lower-level
 * parsing, storage, validation, or filesystem errors should be wrapped by a
 * concrete subclass before leaving the definition module.
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, definition-aware error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent infrastructure-level errors from leaking beyond the definition layer.
 */
export abstract class DefinitionModuleError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * agent service error.
   */
  abstract readonly code: string;

  /**
   * The underlying error that originated this domain error.
   *
   * This value is intended for diagnostics, logging, and debugging,
   * and should generally not be exposed directly to consumers.
   */
  readonly cause?: ErrorOptions;

  // MARK: - Initializer

  /**
   * Creates a new {@link DefinitionModuleError} instance.
   *
   * - Parameter message: A human-readable description of the failure.
   * @param options - Optional error details, including the original cause.
   */
  protected constructor(message: string, cause?: ErrorOptions) {
    super(message);

    this.cause = cause;
  }
}
