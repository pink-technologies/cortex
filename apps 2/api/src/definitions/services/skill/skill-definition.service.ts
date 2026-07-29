// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { BUNDLED_SKILLS_PATH } from '@/definitions/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { STORAGE, type Storage } from '@/infraestructure/storage';
import { DefinitionModuleError } from '@/definitions/error/definition-module-error';
import { SkillDefinition } from '@/definitions/models/skill-definition/skill-definition';
import { SkillsLoader } from './loader/skills-loader';
import {
  SkillAlreadyRegisteredError,
  SkillLoadError,
  SkillNotFoundError,
  SkillServiceError,
} from './error/error';

/**
 * Registers bundled skills during application startup and exposes lookup
 * operations for resolving skills by identity.
 *
 * `SkillDefinitionService` delegates file-system loading to `SkillsLoader`. During module
 * initialization, it loads all bundled skill definitions from the configured
 * root directory, stores each skill by its stable `Skill.id`, and records the
 * id of the single MAIN agent under an internal storage key.
 */
@Injectable()
export class SkillDefinitionService {
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
    @Inject(SkillsLoader)
    private readonly skillsLoader: SkillsLoader,
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
    let skill: SkillDefinition | null = null;

    try {
      skill = await this.storage.read<SkillDefinition>(id);
    } catch (error) {
      throw new SkillServiceError(`Failed to retrieve skill ${id}`, {
        cause: error,
      });
    }

    if (!skill) {
      throw new SkillNotFoundError(id);
    }

    return skill;
  }

  /**
   * Loads every bundled skill definition from disk and persists each one.
   *
   * Delegates directory traversal and manifest handling to
   * {@link SkillsLoader.loadSkillsFromRootDirectory} using the path
   * supplied through {@link BUNDLED_SKILLS_PATH}. For each returned `SkillDefinition`, reads
   * storage for an existing record with the same id; if absent, writes the definition.
   *
   * Intended invariant: at most one stored definition per skill id for the
   * bundled catalog.
   *
   * @throws If the loader fails while scanning or parsing manifests, that failure
   * propagates (see {@link SkillsLoader.loadSkillsFromRootDirectory}).
   * @throws {@link SkillLoadError} When duplicate detection or `storage.write`
   * throws, or when {@link SkillAlreadyRegisteredError} is raised—those cases
   * are caught by the per-skill `try` and surfaced as `SkillLoadError`
   * without preserving the original error type.
   */
  async registerBundledSkills(): Promise<void> {
    const skills = await this.skillsLoader.loadSkillsFromRootDirectory(
      this.bundledSkillsPath,
    );

    for (const skill of skills) {
      try {
        if (await this.storage.read<SkillDefinition>(skill.id)) {
          throw new SkillAlreadyRegisteredError(skill.id);
        }

        await this.storage.write(skill, skill.id);
      } catch (error) {
        if (error instanceof DefinitionModuleError) throw error;

        throw new SkillLoadError(`Failed to register skill: ${skill.id}`, {
          cause: error,
        });
      }
    }
  }
}
