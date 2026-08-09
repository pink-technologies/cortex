// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentRuntimeError } from '@/error/error'

/**
 * Thrown when a skill definition is registered with an id that already exists.
 */
export class SkillAlreadyRegisteredError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate skill registration errors.
   */
  readonly code = 'SKILL_ALREADY_REGISTERED'

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate skill registration.
   *
   * @param skillId - The id of the skill that was already registered.
   * @param options - Optional error details, including the original cause.
   */
  constructor(skillId: string, options?: ErrorOptions) {
    super(`Skill already registered: ${skillId}`, options)
    this.name = new.target.name
  }
}

/**
 * Thrown when a skill lookup finds no matching definition.
 */
export class SkillNotFoundError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for skill-not-found errors.
   */
  readonly code = 'SKILL_NOT_FOUND'

  // MARK: - Constructor

  /**
   * Creates an error describing a missing skill definition.
   *
   * @param skillId - The id of the skill that could not be resolved.
   * @param options - Optional error details, including the original cause.
   */
  constructor(skillId: string, options?: ErrorOptions) {
    super(`Skill not found: ${skillId}`, options)
    this.name = new.target.name
  }
}
