// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Skill } from '@/skills/types/skill.type';
import { SkillInstallationDto } from '../skill-installation/skill-instalation.dto';

/**
 * Data Transfer Object representing a skill returned to the client.
 *
 * This DTO exposes a read-only, sanitized view of the skill entity
 * suitable for API responses, decoupling the response shape from
 * the persistence model.
 */
export class SkillDto {
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

  /**
   * Installations associated to this skill.
   */
  readonly installations: SkillInstallationDto[];

  // Static methods

  /**
   * Creates a {@link SkillDto} from a domain-level {@link SkillWithInstallations}.
   *
   * This method acts as a mapping boundary between the domain
   * entity and the API response layer.
   *
   * @param skill - Skill entity including installations.
   * @returns A response DTO suitable for API responses.
   */
  static from(skill: Skill): SkillDto {
    return {
      id: skill.id,
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      status: skill.status,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
      installations: skill.installations.map(SkillInstallationDto.from),
    };
  }
}
