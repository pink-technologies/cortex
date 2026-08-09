// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for failures raised by `@cortex/integrations` clients and resources.
 *
 * Concrete errors provide a stable, machine-readable {@link code} while retaining
 * the standard error message, stack, and optional {@link Error.cause}.
 */
export abstract class IntegrationsError extends Error {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for this error category.
   */
  abstract readonly code: string

  // MARK: - Constructor

  /**
   * Creates an integrations-layer error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Standard error options, including an optional cause.
   */
  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options)

    this.name = new.target.name
  }
}
