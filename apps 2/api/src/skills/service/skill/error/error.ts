// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { SkillModuleError } from '@/skills/error/skill-module-error';

/**
 * Error thrown when attempting to register a skill that has already been registered.
 *
 * [SkillAlreadyRegisteredError] indicates that a skill with the same identifier
 * already exists in the current registry or module context.
 */
export class SkillAlreadyRegisteredError extends SkillModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate skill registration errors.
   */
  readonly code = 'SKILL_ALREADY_REGISTERED';

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate skill registration.
   *
   * @param skillId - The id of the skill that was already registered.
   * @param options - Optional error details, including the original cause.
   */
  constructor(agentId: string, options?: ErrorOptions) {
    super(`Skill already registered: ${agentId}`, options);
    this.name = new.target.name;
  }
}

/**
 * Error thrown when a skill file cannot be loaded.
 *
 * [SkillFileLoadError] indicates a failure while reading or parsing a skill
 * definition file from the file system.
 */
export class SkillFileLoadError extends SkillModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for skill file load errors.
   */
  readonly code = 'SKILL_FILE_LOAD_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a failure while retrieving the MAIN agent.
   *
   * @param message - A description of the retrieval failure.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Error thrown when a skill definition cannot be loaded.
 *
 * [SkillLoadError] indicates a failure while reading, decoding, validating,
 * or converting a bundled skill definition into a runtime model.
 */
export class SkillLoadError extends SkillModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for agent load errors.
   */
  readonly code = 'SKILL_LOAD_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a failure while retrieving the MAIN agent.
   *
   * @param message - A description of the retrieval failure.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when a skill lookup completes successfully but no matching skill is
 * registered in the skill module.
 *
 * This error should be used only when the lookup mechanism is working as
 * expected, but the requested skill cannot be found. Examples include an unknown
 * skill identifier, a stale reference to a skill that is no longer registered,
 * or a skill definition that was removed from the registry.
 */
export class SkillNotFoundError extends SkillModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for agent load errors.
   */
  readonly code = 'SKILL_NOT_FOUND_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a failure while retrieving the details of a skill.
   *
   * @param message - A description of the retrieval failure.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
