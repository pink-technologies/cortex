// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all kernel-level errors.
 *
 * This abstract error represents failures that occur while the kernel
 * orchestrates agent execution—resolving agents, interpreting model output,
 * enforcing safety/allowlists, and driving the decision loop. It is the
 * boundary between kernel domain failures and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - prevent lower-level provider or tool errors from leaking beyond the
 *   kernel layer without an explicit domain mapping.
 */
export abstract class KernelServiceError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of kernel failure.
   *
   * Codes are stable identifiers intended for logging, metrics, and client
   * mapping—not for free-form display.
   */
  abstract readonly code: string;
}

/**
 * Thrown when the kernel cannot resolve an agent required for execution.
 *
 * Typical cases include a missing MAIN agent, an unknown delegated agent id,
 * or a stale reference to an agent that is no longer registered.
 */
export class KernelAgentNotFoundError extends KernelServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for agent-not-found errors.
   */
  readonly code = 'KERNEL_AGENT_NOT_FOUND';
}

/**
 * Thrown when an agent turn completes without usable output for the kernel.
 *
 * Use this when the model response contains no content the kernel can act on
 * (for example an empty message after a completed turn). Prefer more specific
 * errors when the failure is an unexpected stop reason or a tool/policy
 * violation.
 */
export class KernelEmptyResponseError extends KernelServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for empty-response errors.
   */
  readonly code = 'KERNEL_EMPTY_RESPONSE';

  // MARK: - Constructor

  /**
   * Creates a new {@link KernelEmptyResponseError}.
   *
   * @param message - A human-readable description of the failure.
   */
  constructor(message = 'The kernel received an empty agent response.') {
    super(message);
  }
}

/**
 * Thrown when the kernel encounters a decision type it does not recognize.
 *
 * Decision types drive how the kernel continues the execution loop (for
 * example tool use vs. final response). An unrecognized value usually
 * indicates a protocol mismatch between the agent and the kernel.
 */
export class KernelInvalidDecisionTypeError extends KernelServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for invalid decision-type errors.
   */
  readonly code = 'INVALID_DECISION_TYPE';

  // MARK: - Constructor

  /**
   * Creates a new {@link KernelInvalidDecisionTypeError}.
   *
   * @param decisionType - The unrecognized decision type value.
   */
  constructor(decisionType: string) {
    super();
    this.message = `Invalid decision type: ${decisionType}`;
  }
}

/**
 * Thrown when an agent execution exceeds its configured iteration budget.
 *
 * Each language-model call in the kernel loop counts as one iteration. The
 * limit comes from the agent manifest (`max_iterations`) and exists to prevent
 * runaway tool/model loops.
 */
export class KernelMaximumIterationsError extends KernelServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for maximum-iterations errors.
   */
  readonly code = 'KERNEL_MAXIMUM_ITERATIONS';

  // MARK: - Constructor

  /**
   * Creates a new {@link KernelMaximumIterationsError}.
   *
   * @param maxIterations - The iteration limit that was exceeded.
   */
  constructor(maxIterations: number) {
    super(`Maximum iterations exceeded: ${maxIterations}`);
  }
}

/**
 * Thrown when an agent execution exceeds its configured wall-clock timeout.
 *
 * The limit comes from the agent manifest (`timeout_ms` /
 * {@link AgentExecutionDefinition.timeoutMilliseconds}). The kernel aborts the
 * run with this error as the abort reason when the deadline elapses.
 */
export class KernelTimeoutError extends KernelServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for timeout errors.
   */
  readonly code = 'KERNEL_TIMEOUT';

  // MARK: - Constructor

  /**
   * Creates a new {@link KernelTimeoutError}.
   *
   * @param timeoutMilliseconds - The timeout limit that was exceeded, in
   *   milliseconds.
   */
  constructor(timeoutMilliseconds: number) {
    super(`Execution timed out after ${timeoutMilliseconds}ms`);
  }
}

/**
 * Thrown when the model requests a tool that is not permitted in this run.
 *
 * The kernel enforces the agent's allowlist (and related safety rules) before
 * executing tools. This error indicates the tool name was resolved but is not
 * authorized for the current agent or execution context.
 */
export class KernelToolNotAllowedError extends KernelServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for tool-not-allowed errors.
   */
  readonly code = 'KERNEL_TOOL_NOT_ALLOWED';

  /**
   * Name of the tool that was requested but not allowed.
   */
  readonly toolName: string;

  /**
   * Identifier of the originating tool request.
   */
  readonly toolUseId: string;

  // MARK: - Constructor

  /**
   * Creates a new {@link KernelToolNotAllowedError}.
   *
   * @param toolName - Name of the tool that was requested but not allowed.
   * @param toolUseId - Identifier of the originating tool request.
   */
  constructor(toolName: string, toolUseId: string) {
    super(`Tool not allowed: ${toolName}`);

    this.toolName = toolName;
    this.toolUseId = toolUseId;
  }
}

/**
 * Thrown when the model stops for a reason the kernel cannot continue from.
 *
 * Expected stop reasons (such as a normal completion or tool use) are handled
 * by the loop. Unexpected values—unknown, content-filtered, or otherwise
 * unmapped reasons—surface as this error so callers can fail closed.
 */
export class KernelUnexpectedStopReasonError extends KernelServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for unexpected stop-reason errors.
   */
  readonly code = 'KERNEL_UNEXPECTED_STOP_REASON';

  /**
   * Stop reason reported by the language model.
   */
  readonly stopReason: string;

  /**
   * Human-readable explanation of why this stop reason is invalid in context.
   */
  readonly explanation: string;

  // MARK: - Constructor

  /**
   * Creates a new {@link KernelUnexpectedStopReasonError}.
   *
   * @param stopReason - The stop reason reported by the language model.
   * @param explanation - Why this stop reason cannot be handled by the kernel.
   */
  constructor(stopReason: string, explanation: string) {
    super(`${explanation} (stop reason: ${stopReason})`);

    this.stopReason = stopReason;
    this.explanation = explanation;
  }
}

/**
 * Thrown when a skill-related decision type is not supported by the kernel.
 *
 * Raised when the execution pipeline receives a skill decision variant that
 * the current kernel build does not implement or no longer accepts.
 */
export class SkillDecisionTypeNotSupportedError extends KernelServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for unsupported skill decision-type errors.
   */
  readonly code = 'SKILL_DECISION_TYPE_NOT_SUPPORTED';
}
