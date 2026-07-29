// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { Storage } from '@/infraestructure/storage/storage';
import { STORAGE } from '@/infraestructure/storage';
import { AgentRole } from '../../../agent/models/agent';
import { BUNDLED_AGENTS_PATH } from '@/definitions/tokens';
//import { AgentLoader } from '@/definitions/services/agent/loader/agents-loader';
import { AgentDefinition } from '@/definitions/models/agent-definition/agent-definition';
import { AgentModuleError } from '@/agents/error/agent-module-error';
import {
  AgentAlreadyRegisteredError,
  AgentLoadError,
  AgentNotFoundError,
  DuplicateMainAgentError,
  FailedToGetMainAgentError,
  MainAgentNotFoundError,
} from './error/error';

/**
 * The key used to store the main assistant agent in the storage.
 */
const MAIN_AGENT_ID_KEY = 'agents:main:id';

/**
 * Registers bundled agents during application startup and exposes lookup
 * operations for resolving agents by identity or by their MAIN orchestration
 * role.
 *
 * `AgentService` delegates file-system loading to `AgentLoader`. During module
 * initialization, it loads all bundled agent definitions from the configured
 * root directory, stores each agent by its stable `Agent.id`, and records the
 * id of the single MAIN agent under an internal storage key.
 *
 * The service enforces the runtime invariant that only one MAIN agent can be
 * registered. This MAIN agent acts as the ecosystem's orchestrator and is
 * resolved through `getMainAgent()`.
 */
@Injectable()
export class AgentService {
  // MARK: - Constructor

  /**
   * Creates an agent service using the configured loader, bundled-agent root,
   * and storage backend.
   *
   * @param agentLoader - The loader responsible for reading bundled agent definitions from disk.
   * @param bundledAgentsPath - The root directory containing bundled agent subdirectories.
   * @param storage - The storage backend used to register agents by id and store the MAIN agent index.
   */
  constructor(
    //@Inject(AgentLoader)
    //private readonly agentLoader: AgentLoader,
    @Inject(BUNDLED_AGENTS_PATH)
    private readonly bundledAgentsPath: string,
    @Inject(STORAGE)
    private readonly storage: Storage,
  ) {}

  // MARK: - Instance methods

  /**
   * Finds a registered agent by its stable identifier.
   *
   * @param id - The agent identifier declared in the agent manifest.
   * @returns The registered `Agent`, or `null` when no agent exists for the given id.
   */
  async find(id: string): Promise<AgentDefinition | null> {
    try {
      return this.storage.read<AgentDefinition>(id);
    } catch (error) {
      throw new AgentNotFoundError(id, { cause: error });
    }
  }

  /**
   * Returns the MAIN agent registered for the current ecosystem.
   *
   * The MAIN agent is the orchestrator responsible for coordinating execution,
   * using skills, invoking capabilities, and delegating work to specialist agents
   * when allowed by its configuration.
   *
   * @returns The registered MAIN `Agent`.
   *
   * @throws MainAgentNotFoundError If no MAIN agent id was registered or if the
   * registered id does not resolve to an agent.
   * @throws FailedToGetMainAgentError If storage access fails while resolving the
   * MAIN agent.
   */
  async getMainAgent(): Promise<AgentDefinition> {
    let agent: AgentDefinition | null = null;

    try {
      const mainAgentId = await this.storage.read<string>(MAIN_AGENT_ID_KEY);

      if (!mainAgentId)
        throw new MainAgentNotFoundError('Main agent not found');

      agent = await this.storage.read<AgentDefinition>(mainAgentId);
    } catch (error) {
      if (error instanceof MainAgentNotFoundError) throw error;

      throw new FailedToGetMainAgentError('Failed to get main agent', {
        cause: error,
      });
    }

    if (!agent) {
      throw new MainAgentNotFoundError('Main agent not found');
    }

    return agent;
  }

  /**
   * Loads and registers all bundled agent definitions.
   *
   * This method reads every bundled agent definition from the configured agents
   * root directory and stores each definition by its stable agent identifier.
   * During registration, it also detects the agent declared with the `MAIN` role
   * and stores its identifier under the internal main-agent index key so it can be
   * resolved later through `getMainAgent()`.
   *
   * Registration enforces two invariants:
   *
   * 1. An agent cannot be registered more than once using the same identifier.
   * 2. Only one agent can be registered as the `MAIN` orchestrator.
   *
   * @throws AgentAlreadyRegisteredError If an agent with the same identifier is
   * already registered.
   * @throws DuplicateMainAgentError If more than one bundled agent declares the
   * `MAIN` role.
   * @throws AgentLoadError If an unexpected error occurs while registering a
   * bundled agent.
   */
  async registerBundledAgents(): Promise<void> {
    /*const agents = await this.agentLoader.loadAgentsFromRootDirectory(
      this.bundledAgentsPath,
    );

    for (const agent of agents) {
      try {
        if (await this.storage.read<AgentDefinition>(agent.id)) {
          throw new AgentAlreadyRegisteredError(agent.id);
        }

        await this.storage.write(agent, agent.id);

        if (agent.descriptor.role === AgentRole.Main) {
          if (await this.storage.read<string>(MAIN_AGENT_ID_KEY)) {
            throw new DuplicateMainAgentError(agent.id);
          }

          await this.storage.write(agent.id, MAIN_AGENT_ID_KEY);
        }
      } catch (error) {
        if (error instanceof AgentModuleError) throw error;

        throw new AgentLoadError(`Failed to register agent: ${agent.id}`, {
          cause: error,
        });
      }
    }*/
  }
}
