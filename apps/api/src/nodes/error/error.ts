// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for failures raised by the node-registration feature.
 *
 * Concrete node errors expose a stable, machine-readable {@link code} while
 * preserving the standard error message, stack, and optional
 * {@link Error.cause}. Service and transport layers can classify registration,
 * lookup, heartbeat, or persistence failures without parsing human-readable
 * messages.
 */
export abstract class NodeModuleError extends Error {
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
   * Creates a node-feature error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Standard error options, including an optional underlying
   *   failure in `cause`.
   *
   * The concrete class name is assigned to {@link Error.name} so logs and stack
   * traces identify the specific node failure.
   */
  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options)

    this.name = new.target.name
  }
}

/**
 * Indicates that a node lookup by installation identifier could not be
 * completed.
 *
 * This represents an operational lookup failure, such as a database error,
 * rather than a successful lookup that found no matching node.
 */
export class FindNodeByInstallationIdFailedError extends NodeModuleError {
  // MARK: - Properties

  /** Stable machine-readable code for installation-based lookup failures. */
  readonly code = 'FIND_NODE_BY_INSTALLATION_ID_FAILED_ERROR'

  // MARK: - Constructor

  /**
   * Creates an installation-based node lookup failure.
   *
   * @param message - Human-readable description of the failed lookup.
   * @param options - Standard error options, including an optional underlying
   *   failure in `cause`.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

/**
 * Indicates that a general node lookup could not be completed.
 *
 * This represents an operational lookup failure, such as a database error,
 * rather than a successful lookup that found no matching node.
 */
export class FindNodeFailedError extends NodeModuleError {
  // MARK: - Properties

  /** Stable machine-readable code for general node lookup failures. */
  readonly code = 'FIND_NODE_FAILED_ERROR'

  // MARK: - Constructor

  /**
   * Creates a general node lookup failure.
   *
   * @param message - Human-readable description of the failed lookup.
   * @param options - Standard error options, including an optional underlying
   *   failure in `cause`.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}
  
/**
 * Indicates that a node heartbeat could not be completed.
 *
 * This represents an operational heartbeat failure, such as a database error,
 * rather than a successful heartbeat that found no matching node.
 */
export class HeartbeatNodeFailedError extends NodeModuleError {
    // MARK: - Properties

    /** Stable machine-readable code for node heartbeat failures. */
    readonly code = 'HEARTBEAT_NODE_FAILED_ERROR'

    // MARK: - Constructor

    /**
     * Creates a node heartbeat failure.
     *
     * @param message - Human-readable description of the failed heartbeat.
     * @param options - Standard error options, including an optional underlying
     *   failure in `cause`.
     */
    constructor(message: string, options?: ErrorOptions) {
      super(message, options)
    }
}

/**
 * Indicates that a node has been disabled.
 *
 * This represents a node that has been disabled and is no longer allowed to participate in the system.
 */
export class NodeDisabledError extends NodeModuleError {
  // MARK: - Properties

  /** Stable machine-readable code for node disabled errors. */
  readonly code = 'NODE_DISABLED_ERROR'

  // MARK: - Constructor

  /**
   * Creates a node disabled error.
   *
   * @param id - Stable node identifier.
   * @param options - Standard error options, including an optional underlying
   *   failure in `cause`.
   */
  constructor(id: string, options?: ErrorOptions) {
    super(`Execution node ${id} has been disabled`, options)
  }
}

/**
 * Indicates that a node could not be found.
 *
 * This represents a node that is not registered in the system.
 */
export class NodeNotFoundError extends NodeModuleError {
  // MARK: - Properties

  /** Stable machine-readable code for node not found errors. */
  readonly code = 'NODE_NOT_FOUND_ERROR'

  // MARK: - Constructor

  /**
   * Creates a node not found error.
   *
   * @param id - Stable node identifier.
   * @param options - Standard error options, including an optional underlying
   *   failure in `cause`.
   */
  constructor(id: string, options?: ErrorOptions) {
    super(`Execution node ${id} not found`, options)
  }
}

/**
 * Indicates that a node has been revoked.
 *
 * This represents a node that has been revoked from the system and is no longer
 * allowed to participate in the system.
 */
export class NodeRevokedError extends NodeModuleError {
  // MARK: - Properties

  /** Stable machine-readable code for node revoked errors. */
  readonly code = 'NODE_REVOKED_ERROR'

  // MARK: - Constructor

  /**
   * Creates a node revoked error.
   *
   * @param id - Stable node identifier.
   * @param options - Standard error options, including an optional underlying
   *   failure in `cause`.
   */
  constructor(id: string, options?: ErrorOptions) {
    super(`Execution node ${id} has been revoked`, options)
  }
}

/**
 * Indicates that a node registration could not be completed.
 *
 * This represents an operational registration failure, such as a database error,
 * rather than a successful registration that found no matching node.
 */
export class RegisterNodeFailedError extends NodeModuleError {
  // MARK: - Properties

  /** Stable machine-readable code for node registration failures. */
  readonly code = 'REGISTER_NODE_FAILED_ERROR'

  // MARK: - Constructor

  /**
   * Creates a node registration failure.
   *
   * @param message - Human-readable description of the failed registration.
   * @param options - Standard error options, including an optional underlying
   *   failure in `cause`.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}