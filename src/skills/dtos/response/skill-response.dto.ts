// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Skill } from 'src/infraestructure/database';

/**
 * Data Transfer Object representing a skill returned to the client.
 *
 * This DTO exposes a read-only, sanitized view of the skill entity
 * suitable for API responses, decoupling the response shape from
 * the persistence model.
 */
export class SkillResponseDto {
  /**
   * Unique identifier of the skill.
   */
  readonly id: string;

  /**
   * URL-friendly unique identifier (slug) for the skill.
   */
  readonly slug: string;

  /**
   * Human-readable name of the skill.
   */
  readonly name: string;

  /**
   * Optional description of the skill.
   */
  readonly description: string | null;

  /**
   * Current status of the skill (e.g. ACTIVE, DRAFT, DISABLED).
   */
  readonly status: string;

  /**
   * Date and time when the skill was created.
   */
  readonly createdAt: Date;

  /**
   * Date and time when the skill was last updated.
   */
  readonly updatedAt: Date;

  // Static methods

  /**
   * Creates a {@link SkillResponseDto} from a domain-level {@link Skill}.
   *
   * This method acts as a mapping boundary between the domain
   * entity and the API response layer.
   *
   * @param skill - The domain skill entity from the database layer.
   * @returns A response DTO suitable for API responses.
   */
  static from(skill: Skill): SkillResponseDto {
    return {
      id: skill.id,
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      status: skill.status,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  }
}
