// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { SkillsRepository } from '../repositories/skills.repository';
import type { SkillsQuery } from '../types/skills-query.type';
import { SkillDto } from '../dtos/response/skill/skill.dto';
import { SkillNotFoundError } from './error/skills.error';

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
  async findById(id: string): Promise<SkillDto> {
    const skill = await this.skillsRepository.findById(id);

    if (!skill) throw new SkillNotFoundError();

    return SkillDto.from(skill);
  }

  /**
   * Retrieves skills with optional filter and pagination.
   * Size is fixed at 50 per page. Page is 1-based (1, 2, 3...).
   *
   * @param query - name, page
   * @returns Array of skills (50 max per page).
   */
  async retrieve(query: SkillsQuery): Promise<SkillDto[]> {
    const skills = await this.skillsRepository.retrieve({
      q: query.q,
      page: query.page,
      size: query.size,
    });

    return skills.map(SkillDto.from);
  }
}
