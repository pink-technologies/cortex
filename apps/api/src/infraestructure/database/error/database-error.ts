// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all database-related errors.
 *
 * This abstract error represents failures that occur within the
 * persistence layer and serves as a strict boundary between
 * database-specific concerns and higher application layers.
 */
export abstract class DatabaseError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * database failure.
   */
  abstract readonly code: string;

  /**
   * The underlying error that caused this database failure.
   *
   * This value is intended for internal use only (logging,
   * tracing, diagnostics) and must not be exposed directly
   * to API consumers.
   */
  readonly cause?: unknown;

  // MARK: - Constructor

  /**
   * Creates a new {@link DatabaseError} instance.
   *
   * The provided message should describe the failure in a
   * persistence-agnostic and user-safe manner.
   *
   * @param message - A human-readable description of the database error.
   * @param cause - The underlying error that triggered this failure.
   */
  constructor(message: string, cause?: unknown) {
    super(message);

    this.cause = cause;
    this.name = new.target.name;
  }
}

/**
 * Error thrown when a database query is malformed, invalid,
 * or cannot be executed as constructed.
 *
 * Examples include:
 * - invalid query structure,
 * - unsupported operators,
 * - schema mismatches at query time.
 */
export class DatabaseInvalidQueryError extends DatabaseError {
  /**
   * A machine-readable error code identifying invalid query failures.
   */
  readonly code = 'INVALID_QUERY';
}

/**
 * Error thrown when a database operation violates a uniqueness
 * or conflict constraint.
 *
 * This typically occurs when attempting to create or update
 * an entity that already exists and must be unique.
 */
export class DatabaseEntityConflictError extends DatabaseError {
  /**
   * A machine-readable error code identifying entity conflict failures.
   */
  readonly code = 'ENTITY_CONFLICT';
}

/**
 * Error thrown when a requested database entity cannot be found.
 *
 * This error represents a valid query that yielded no result.
 */
export class DatabaseEntityNotFoundError extends DatabaseError {
  /**
   * A machine-readable error code identifying missing entity failures.
   */
  readonly code = 'ENTITY_NOT_FOUND';
}

/**
 * Error thrown when an unexpected or unrecoverable database
 * failure occurs.
 *
 * This error is used as a fallback when the failure cannot be
 * classified into a more specific database error type.
 */
export class DatabaseInternalError extends DatabaseError {
  /**
   * A machine-readable error code identifying internal database failures.
   */
  readonly code = 'INTERNAL_ERROR';
}

/**
 * Error thrown when a required value is missing from a database
 * operation.
 *
 * This typically indicates that a mandatory field was omitted
 * during a create or update operation.
 */
export class DatabaseMissingRequiredValueError extends DatabaseError {
  /**
   * A machine-readable error code identifying missing required values.
   */
  readonly code = 'MISSING_REQUIRED_VALUE';
}

/**
 * Error thrown when a null constraint is violated.
 *
 * This occurs when a database column that does not allow `NULL`
 * receives a null or undefined value.
 */
export class DatabaseNullConstraintViolationError extends DatabaseError {
  /**
   * A machine-readable error code identifying null constraint violations.
   */
  readonly code = 'NULL_CONSTRAINT_VIOLATION';
}
