// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Skill } from 'src/infraestructure/database';
import { SkillsRepository } from '../repositories/skills.repository';
import {
  SkillNotFoundError,
  SkillRequiredIdError,
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
   * @returns The matching skill entity.
   *
   * @throws SkillRequiredIdError when the id is empty or not provided.
   * @throws SkillNotFoundError when the skill cannot be found.
   */
  async findById(id: string): Promise<Skill> {
    const normalizedId = id.trim();

    if (!normalizedId) throw new SkillRequiredIdError;

    const skill = await this.skillsRepository.findById(normalizedId);

    if (!skill) throw new SkillNotFoundError;

    return skill;
  }

  /**
   * Finds a single skill by name.
   *
   * @param name - The name of the skill to search.
   * @returns The matching skill entity.
   *
   * @throws SkillNotFoundError when the skill cannot be found.
   */
  async findByName(name: string): Promise<Skill> {
    const normalizedName = name.trim();

    const skill = await this.skillsRepository.findByName(normalizedName);

    if (!skill) throw new SkillNotFoundError;

    return skill;
  }

  /**
   * Checks whether a skill name is already registered.
   *
   * @param name - The skill name to validate.
   * @returns A status object describing whether the skill is registered.
   */
  async isSkillRegistered(name: string): Promise<{ message: string }> {
    const registered = await this.skillsRepository.isSkillRegistered(name);

    return {
      message: registered
        ? 'Skill is already registered.'
        : 'Skill is not registered.',
    };
  }

  /**
   * Retrieves all skills.
   *
   * @returns An array of all registered skills.
   */
  async retrieve(): Promise<Skill[]> {
    return this.skillsRepository.retrieve();
  }
}
