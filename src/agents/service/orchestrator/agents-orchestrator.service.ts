// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { AgentDto } from '@/agents/dto/index';
import {
  AgentsRepository,
  AgentsIntentRepository,
} from '@/agents/repositories/index';
import {
  AgentIntentNotFoundError,
  AgentNotFoundError,
} from '../error/agents.error';

/**
 * Service responsible for orchestrating agent by intent slug use-cases.
 *
 * Responsibilities:
 * - validate input for orchestration operations.
 * - orchestrate repository calls.
 * - map missing/invalid data into HTTP exceptions.
 */
@Injectable()
export class OrchestratorService {
  // MARK: - Constructor

  /**
   * Creates a new {@link OrchestratorService}.
   *
   * @param agentsIntentRepository - The repository responsible for agent intent persistence
   * and lookup operations.
   * @param agentsRepository - The repository responsible for agent persistence
   */
  constructor(
    private readonly agentsIntentRepository: AgentsIntentRepository,
    private readonly agentsRepository: AgentsRepository,
  ) { }

  /**
   * Resolves the agent by intent slug.
   *
   * @param intentSlug - The intent slug (e.g. "summarize", "answer_question").
   * @returns The agent as {@link AgentDto}.
   * @throws AgentIntentNotFoundError when the slug is unknown or no agent is linked to that intent.
   * @throws AgentNotFoundError when the agent is not found.
   */
  async resolveAgentByIntent(slug: string): Promise<AgentDto> {
    const agentIntent = await this.agentsIntentRepository.findByIntent(slug.trim());

    if (!agentIntent) throw new AgentIntentNotFoundError();

    const agent = await this.agentsRepository.findById(agentIntent.agentId);

    if (!agent) throw new AgentNotFoundError();

    return AgentDto.from(agent);
  }
}
