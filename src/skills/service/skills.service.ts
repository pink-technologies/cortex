// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { SkillsRepository } from '../repositories/skills.repository';
import type { SkillsQuery } from '../types/skills-query.type';
import { SkillResponseDto } from '../dtos/response/skill-response.dto';
import {
  SkillNotFoundError,
  SkillRequiredIdError,
  SkillRequiredNameError,
} from './error/skills.error';

/**
 * Service responsible for skills read use-cases.
 *
 * Responsibilities:
 * - validate input for read operations,
 * - orchestrate repository calls,
 * - map missing/invalid data into HTTP exceptions.
 */
@Injectable()
export class SkillsService {
  // MARK: - Constructor

  /**
   * Creates a new {@link SkillsService}.
   *
   * @param skillsRepository - The repository responsible for skill persistence
   * and lookup operations.
   */
  constructor(
    private readonly skillsRepository: SkillsRepository,
  ) { }

  // MARK: - Instance methods

  /**
   * Finds a single skill by id.
   *
   * @param id - The unique identifier of the skill.
   * @returns The matching skill as a response DTO.
   *
   * @throws SkillRequiredIdError when the id is empty or not provided.
   * @throws SkillNotFoundError when the skill cannot be found.
   */
  async findById(id: string): Promise<SkillResponseDto> {
    const normalizedId = id.trim();

    if (!normalizedId) throw new SkillRequiredIdError();

    const skill = await this.skillsRepository.findById(normalizedId);

    if (!skill) throw new SkillNotFoundError();

    return SkillResponseDto.from(skill);
  }

  /**
   * Checks whether a skill name is already registered.
   *
   * The name is normalized (trimmed) before lookup; empty or whitespace-only
   * names are rejected.
   *
   * @param name - The skill name to validate.
   * @returns A status object describing whether the skill is registered.
   * @throws SkillRequiredNameError when the name is empty or only whitespace.
   */
  async isSkillRegistered(name: string): Promise<{ message: string }> {
    const normalizedName = name.trim();

    if (!normalizedName) throw new SkillRequiredNameError();

    const registered = await this.skillsRepository.isSkillRegistered(normalizedName);

    return {
      message: registered
        ? 'Skill is already registered.'
        : 'Skill is not registered.',
    };
  }

  /**
   * Retrieves skills with optional filter and pagination.
   * Size is fixed at 50 per page. Page is 1-based (1, 2, 3...).
   *
   * @param query - name, page
   * @returns Array of skills (50 max per page).
   */
  async retrieve(query: SkillsQuery): Promise<SkillResponseDto[]> {
    const skills = await this.skillsRepository.retrieve({
      q: query.q,
      page: query.page,
      size: query.size,
    });

    return skills.map(SkillResponseDto.from);
  }
}
