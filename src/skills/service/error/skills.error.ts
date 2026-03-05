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
export abstract class SkillServiceError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * skill service error.
     */
    abstract readonly code: string;
}

/**
 * Error thrown when an attempt is made to find or act on a skill
 * that does not exist in the system.
 *
 * This typically occurs when a requested skill cannot be found
 * using its unique identifier or name.
 */
export class SkillNotFoundError extends SkillServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying skill-not-found errors.
     */
    readonly code = 'SKILL_NOT_FOUND';
}

/**
 * Error thrown when a skill operation that explicitly requires
 * a skill identifier is invoked without one.
 *
 * This typically happens when the caller passes an empty string
 * or undefined to a service method that expects an ID.
 */
export class SkillRequiredIdError extends SkillServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying missing skill ID errors.
     */
    readonly code = 'SKILL_REQUIRED_ID';
}

/**
 * Error thrown when a skill operation that requires a skill name
 * is invoked with an empty or whitespace-only name.
 *
 * This typically happens when the caller passes an empty string
 * or only spaces to a service method that expects a name (e.g. isSkillRegistered).
 */
export class SkillRequiredNameError extends SkillServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying missing skill name errors.
     */
    readonly code = 'SKILL_REQUIRED_NAME';
}
