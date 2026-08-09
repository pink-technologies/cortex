// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for errors raised by the workflow module.
 *
 * Subclasses expose a stable, machine-readable {@link code} while retaining a
 * human-readable message and optional diagnostic context.
 */
export abstract class WorkflowModuleError extends Error {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for this error category.
   */
  abstract readonly code: string

  // MARK: - Constructor

  /**
   * Creates a workflow module error.
   *
   * @param message - Human-readable description of the failure.
   * @param options - Optional diagnostic options, including an underlying
   *   error in `cause`.
   */
  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options)

    this.name = new.target.name
  }
}

/**
 * Indicates that creating a workflow run (and its steps) failed.
 */
export class WorkflowRunCreateError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for create failures.
   */
  readonly code = 'WORKFLOW_RUN_CREATE_ERROR'

  // MARK: - Constructor

  /**
   * Creates a workflow-run create error.
   *
   * @param message - Human-readable description of the create failure.
   * @param options - Optional diagnostic options containing the originating
   *   failure in `cause`.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

/**
 * Indicates that loading a workflow run failed unexpectedly.
 *
 * A missing row is not represented by this error; repositories return `null`.
 */
export class WorkflowRunReadError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for read failures.
   */
  readonly code = 'WORKFLOW_RUN_READ_ERROR'

  // MARK: - Constructor

  /**
   * Creates a workflow-run read error.
   *
   * @param message - Human-readable description of the read failure.
   * @param options - Optional diagnostic options containing the originating
   *   failure in `cause`.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

/**
 * Indicates that updating a workflow run status failed unexpectedly.
 *
 * A no-op update (unknown id) is not represented by this error; repositories
 * return `false`.
 */
export class WorkflowRunUpdateError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for run update failures.
   */
  readonly code = 'WORKFLOW_RUN_UPDATE_ERROR'

  // MARK: - Constructor

  /**
   * Creates a workflow-run update error.
   *
   * @param message - Human-readable description of the update failure.
   * @param options - Optional diagnostic options containing the originating
   *   failure in `cause`.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

/**
 * Indicates that updating a workflow step status failed unexpectedly.
 *
 * A no-op update (unknown id) is not represented by this error; repositories
 * return `false`.
 */
export class WorkflowStepUpdateError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for step update failures.
   */
  readonly code = 'WORKFLOW_STEP_UPDATE_ERROR'

  // MARK: - Constructor

  /**
   * Creates a workflow-step update error.
   *
   * @param message - Human-readable description of the update failure.
   * @param options - Optional diagnostic options containing the originating
   *   failure in `cause`.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
  }
}

/**
 * Indicates that a workflow definition key is already registered.
 */
export class WorkflowDefinitionAlreadyRegisteredError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for duplicate definition registration.
   */
  readonly code = 'WORKFLOW_DEFINITION_ALREADY_REGISTERED'

  /**
   * Definition key that collided.
   */
  readonly definitionKey: string

  /**
   * Definition version that collided.
   */
  readonly definitionVersion: number

  // MARK: - Constructor

  /**
   * Creates an error for a duplicate workflow definition registration.
   *
   * @param definitionKey - Definition key that is already registered.
   * @param definitionVersion - Definition version that is already registered.
   */
  constructor(definitionKey: string, definitionVersion: number) {
    super(`Workflow definition already registered: ${definitionKey}@${definitionVersion}`)
    this.definitionKey = definitionKey
    this.definitionVersion = definitionVersion
  }
}

/**
 * Indicates that a workflow definition failed structural validation.
 */
export class WorkflowDefinitionInvalidError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for invalid definitions.
   */
  readonly code = 'WORKFLOW_DEFINITION_INVALID'

  /**
   * Definition key that failed validation, when known.
   */
  readonly definitionKey: string

  // MARK: - Constructor

  /**
   * Creates an error for an invalid workflow definition.
   *
   * @param definitionKey - Definition key under validation.
   * @param message - Human-readable description of the validation failure.
   */
  constructor(definitionKey: string, message: string) {
    super(message)
    this.definitionKey = definitionKey
  }
}

/**
 * Indicates that advancing a workflow run failed for a domain reason.
 *
 * Examples: the next step is not an activatable `JOB` (outside the approval
 * park path). Persistence failures use the dedicated create/update error types.
 */
export class WorkflowAdvanceError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for advance failures.
   */
  readonly code = 'WORKFLOW_ADVANCE_ERROR'

  /**
   * Run id that failed to advance, when known.
   */
  readonly runId: string

  // MARK: - Constructor

  /**
   * Creates a workflow advance error.
   *
   * @param runId - Run that failed to advance.
   * @param message - Human-readable description of the advance failure.
   * @param options - Optional diagnostic options containing the originating
   *   failure in `cause`.
   */
  constructor(runId: string, message: string, options?: ErrorOptions) {
    super(message, options)
    this.runId = runId
  }
}

/**
 * Indicates that an approval decision could not be applied.
 *
 * Raised when the named step is not the run's current `AWAITING_APPROVAL`
 * gate (obsolete step → HTTP 409), is not an `APPROVAL` kind, or when a
 * {@link DecideWorkflowRunApprovalParameters.decisionId} is reused with a
 * conflicting command. Idempotent retries that repeat the same decision id,
 * run, step, and outcome succeed without this error. Missing runs are not
 * represented by this error; the orchestrator returns `null`.
 */
export class WorkflowApprovalError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for approval failures.
   */
  readonly code = 'WORKFLOW_APPROVAL_ERROR'

  /**
   * Run id whose approval decision failed.
   */
  readonly runId: string

  // MARK: - Constructor

  /**
   * Creates a workflow approval error.
   *
   * @param runId - Run whose approval decision failed.
   * @param message - Human-readable description of the approval failure.
   * @param options - Optional diagnostic options containing the originating
   *   failure in `cause`.
   */
  constructor(runId: string, message: string, options?: ErrorOptions) {
    super(message, options)
    this.runId = runId
  }
}

/**
 * Indicates that a cancellation request could not be applied.
 *
 * Raised when the run is already terminal (`COMPLETED`, `FAILED`, or
 * `CANCELLED`), including when a concurrent transition wins the race against
 * the cancellation. Missing runs are not represented by this error; the
 * orchestrator returns `null`.
 */
export class WorkflowCancelError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for cancellation failures.
   */
  readonly code = 'WORKFLOW_CANCEL_ERROR'

  /**
   * Run id whose cancellation failed.
   */
  readonly runId: string

  // MARK: - Constructor

  /**
   * Creates a workflow cancellation error.
   *
   * @param runId - Run whose cancellation failed.
   * @param message - Human-readable description of the cancellation failure.
   * @param options - Optional diagnostic options containing the originating
   *   failure in `cause`.
   */
  constructor(runId: string, message: string, options?: ErrorOptions) {
    super(message, options)
    this.runId = runId
  }
}

/**
 * Indicates that starting a workflow run failed for a domain reason.
 *
 * Examples: the first step is not a `JOB`, or activation could not complete.
 * Missing definitions use {@link WorkflowDefinitionNotFoundError}. Persistence
 * failures use the dedicated create/update error types.
 */
export class WorkflowStartError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for start failures.
   */
  readonly code = 'WORKFLOW_START_ERROR'

  /**
   * Definition key that was being started, when known.
   */
  readonly definitionKey: string

  // MARK: - Constructor

  /**
   * Creates a workflow start error.
   *
   * @param definitionKey - Definition key that was being started.
   * @param message - Human-readable description of the start failure.
   * @param options - Optional diagnostic options containing the originating
   *   failure in `cause`.
   */
  constructor(definitionKey: string, message: string, options?: ErrorOptions) {
    super(message, options)
    this.definitionKey = definitionKey
  }
}

/**
 * Indicates that no workflow definition is registered for the given key.
 */
export class WorkflowDefinitionNotFoundError extends WorkflowModuleError {
  // MARK: - Properties

  /**
   * Stable machine-readable identifier for missing definitions.
   */
  readonly code = 'WORKFLOW_DEFINITION_NOT_FOUND'

  /**
   * Definition key that was requested.
   */
  readonly definitionKey: string

  /**
   * Definition version that was requested, when an exact pin was required.
   */
  readonly definitionVersion?: number

  // MARK: - Constructor

  /**
   * Creates an error for a missing workflow definition.
   *
   * @param definitionKey - Definition key that could not be resolved.
   * @param definitionVersion - Optional exact version that could not be resolved.
   */
  constructor(definitionKey: string, definitionVersion?: number) {
    super(
      definitionVersion === undefined
        ? `Workflow definition not found: ${definitionKey}`
        : `Workflow definition not found: ${definitionKey}@${definitionVersion}`,
    )
    this.definitionKey = definitionKey
    this.definitionVersion = definitionVersion
  }
}
