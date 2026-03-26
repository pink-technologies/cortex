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
export abstract class SkillsServiceError extends Error {
  // MARK: - Properties

  /**
   * A machine-readable error code identifying the type of
   * skill service error.
   */
  abstract readonly code: string;
}

/**
 * Thrown when a skill registration is attempted but the skill (or its identifier)
 * is already registered in the system.
 *
 * Use this to avoid duplicate registrations or conflicting skill identity in the registry.
 */
export class SkillAlreadyRegisteredError extends SkillsServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate skill registration errors.
   */
  readonly code = 'SKILL_ALREADY_REGISTERED';
}

/**
 * Thrown when a skill fails to load from a file.
 */
export class SkillFileLoadError extends SkillsServiceError {
  // MARK: - Properties

  /**
   * Machine-readable code for skill file load errors.
   */
  readonly code = 'SKILL_FILE_LOAD_ERROR';
}