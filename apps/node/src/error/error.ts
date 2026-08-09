// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for failures raised by Cortex Node application services.
 *
 * Concrete node errors provide a stable, machine-readable {@link code} while
 * retaining the standard error message, stack, and optional {@link Error.cause}.
 * Callers can classify failures without parsing human-readable messages, and
 * logging or transport boundaries can preserve the original diagnostic chain.
 */
export abstract class NodeApplicationError extends Error {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for this error category.
   *
   * Consumers should branch on this value rather than parsing
   * {@link Error.message}.
   */
  abstract readonly code: string

  // MARK: - Constructor

  /**
   * Creates a Cortex Node module error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Standard error options, including an optional underlying
   *   failure in `cause`.
   *
   * The concrete class name is assigned to {@link Error.name} so logs and stack
   * traces identify the specific node error type.
   */
  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options)

    this.name = new.target.name
  }
}
