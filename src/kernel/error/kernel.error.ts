// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all skill service–level errors.
 *
 * This abstract error represents failures that occur within the
 * skill application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class KernelServiceError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * skill service error.
     */
    abstract readonly code: string;
}

/**
 * Thrown when an agent is not found.
 */
export class KernelAgentNotFoundError extends KernelServiceError {
    // MARK: - Properties

    /**
     * Machine-readable code for agent not found errors.
     */
    readonly code = 'KERNEL_AGENT_NOT_FOUND';
}

/**
 * Thrown when an invalid decision type is encountered.
 */
export class KernelInvalidDecisionTypeError extends KernelServiceError {
    // MARK: - Properties

    /**
     * Machine-readable code for invalid decision type errors.
     */
    readonly code = 'INVALID_DECISION_TYPE';

    // MARK: - Constructor

    /**
     * Creates a new {@link KernelInvalidDecisionTypeError}.
     *
     * @param decisionType - The invalid decision type.
     */
    constructor(decisionType: string) {
        super();
        this.message = `Invalid decision type: ${decisionType}`;
    }
}

/**
 * Thrown when a skill decision type is not supported.
 */
export class SkillDecisionTypeNotSupportedError extends KernelServiceError {
    // MARK: - Properties

    /**
     * Machine-readable code for skill decision type not supported errors.
     */
    readonly code = 'SKILL_DECISION_TYPE_NOT_SUPPORTED';
}