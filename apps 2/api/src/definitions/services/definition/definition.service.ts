// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { BootstrapError } from './error/error';
import { AgentDefinitionService } from '../agent/agent-definition.service'
import { CapabilityDefinitionService } from '../capability/capability-definition.service'
import { SkillDefinitionService } from '../skill/skill-definition.service'

/**
 * Coordinates loading and persistence of bundled definitions (capabilities, skills, agents)
 * during application startup.
 *
 * `DefinitionService` is the single entry point for the definitions bootstrap sequence:
 * it delegates to the injected domain services in a fixed order so downstream manifests
 * can rely on prerequisites already being registered in storage.
 */
@Injectable()
export class DefinitionService implements OnApplicationBootstrap {
  // MARK: - Constructor

  /**
   * @param agentDefinitionService - Registers bundled agents after capabilities and skills.
   * @param capabilityDefinitionService - Registers bundled capabilities first in the bootstrap chain.
   * @param skilDefinitionService - Registers bundled skills after capabilities and before agents.
   */
  constructor(
    @Inject(AgentDefinitionService)
    private readonly agentDefinitionService: AgentDefinitionService,
    @Inject(CapabilityDefinitionService)
    private readonly capabilityDefinitionService: CapabilityDefinitionService,
    @Inject(SkillDefinitionService)
    private readonly skillDefinitionService: SkillDefinitionService,
  ) {}

  // MARK: - Instance methods

  /**
   * Runs the bundled-definitions bootstrap sequence.
   *
   * Order: capabilities and skills run in parallel, then
   * {@link AgentDefinitionService.registerBundledAgents()}. Agents run last so manifests that reference
   * capability or skill ids can resolve against an already-populated catalog where applicable.
   *
   * @throws {@link BootstrapError} When any step fails; the wrapped `cause` is the original error.
   */
  async bootstrap(): Promise<void> {
    try {
      await Promise.all([
        this.capabilityDefinitionService.registerBundledCapabilities(),
        this.skillDefinitionService.registerBundledSkills(),
      ])

      await this.agentDefinitionService.registerBundledAgents()
    } catch (error) {
      throw new BootstrapError({ cause: error })
    }
  }

  // MARK: - OnApplicationBootstrap

  async onApplicationBootstrap(): Promise<void> {
    await this.bootstrap()
  }
}
