// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { SkillServiceError } from "src/skills/service/error/skills.error";

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
export abstract class AgentServiceError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * agent service error.
     */
    abstract readonly code: string;
}

/**
 * Error thrown when an attempt is made to deprecate an agent
 * that is already deprecated.
 */
export class AgentAlreadyDeprecatedError extends AgentServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying agent-already-deprecated errors.
     */
    readonly code = 'AGENT_ALREADY_DEPRECATED';
}

/**
 * Error thrown when an attempt is made to find or act on an agent
 * that does not exist in the system.
 *
 * This typically occurs when a requested agent cannot be found
 * using its unique identifier or name.
 */
export class AgentNotFoundError extends AgentServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying agent-not-found errors.
     */
    readonly code = 'AGENT_NOT_FOUND';
}

/**
 * Error thrown when a agent operation that explicitly requires
 * a agent identifier is invoked without one.
 *
 * This typically happens when the caller passes an empty string
 * or undefined to a service method that expects an ID.
 */
export class AgentRequiredIdError extends AgentServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying missing agent ID errors.
     */
    readonly code = 'AGENT_REQUIRED_ID';
}

/**
 * Error thrown when a agent operation that requires a agent name
 * is invoked with an empty or whitespace-only name.
 *
 * This typically happens when the caller passes an empty string
 * or only spaces to a service method that expects a name (e.g. isAgentRegistered).
 */
export class AgentRequiredNameError extends AgentServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying missing agent name errors.
     */
    readonly code = 'AGENT_REQUIRED_NAME';
}