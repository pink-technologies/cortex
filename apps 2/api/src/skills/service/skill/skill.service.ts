// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { STORAGE, type Storage } from '@/infraestructure/storage';
import { BUNDLED_SKILLS_PATH } from '../../tokens';
import { SkillDefinition } from './definition/skill-definition';
import { SkillLoader } from './loader/skill-loader';
import { SkillModuleError } from '../../error/skill-module-error';
import {
  SkillAlreadyRegisteredError,
  SkillLoadError,
  SkillNotFoundError,
} from './error/error';

@Injectable()
export class SkillService  {
  // MARK: - Constructor

  /**
   * Creates a service for loading and retrieving skills from the configured
   * storage backend.
   *
   * The service uses the bundled skills path to locate built-in skill
   * definitions, delegates parsing and validation to the skill loader, and reads
   * persisted skill data through the configured storage provider.
   *
   * @param bundledSkillsPath - The filesystem path where bundled skill
   * definitions are located.
   * @param skillLoader - The loader responsible for reading, parsing, and
   * validating skill definitions.
   * @param storage - The storage provider used to read persisted skill data.
   */
  constructor(
    @Inject(BUNDLED_SKILLS_PATH)
    private readonly bundledSkillsPath: string,
    @Inject(SkillLoader)
    private readonly skillLoader: SkillLoader,
    @Inject(STORAGE)
    private readonly storage: Storage,
  ) {}

  // MARK: - Instance methods

  /**
   * Finds a registered skill by its stable identifier.
   *
   * @param id - The skill identifier declared in the skill manifest.
   * @returns The registered `Skill`, or `null` when no skill exists for the given id.
   */
  async find(id: string): Promise<SkillDefinition | null> {
    try {
      return this.storage.read<SkillDefinition>(id);
    } catch (error) {
      throw new SkillNotFoundError(id, { cause: error });
    }
  }

  // MARK: - Instance methods

  async registerBundledSkills(): Promise<void> {
    const skills = await this.skillLoader.loadSkillsFromRootDirectory(
      this.bundledSkillsPath,
    );

    for (const skill of skills) {
      try {
        if (await this.storage.read<SkillDefinition>(skill.id)) {
          throw new SkillAlreadyRegisteredError(skill.id);
        }

        await this.storage.write(skill, skill.id);
      } catch (error) {
        if (error instanceof SkillModuleError) throw error;

        throw new SkillLoadError(`Failed to register skill: ${skill.id}`, {
          cause: error,
        });
      }
    }
  }
}
