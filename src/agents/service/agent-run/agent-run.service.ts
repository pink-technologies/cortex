// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentsRepository } from '@/agents/repositories';
import { Injectable } from '@nestjs/common';
import { AgentNotFoundError } from '../error/agents.error';
import { ChatRepository } from '@/chats/repositories/chat.repository';
import { AgentRunResponseDto } from '@/agents/dto/response/agent-run/agent-run.response.dto';
import { ChatNotFoundError } from '@/chats/service/error/chat.error';

/**
 * Service responsible for running agents on chats.
 *
 * Responsibilities:
 * - validate input for run operations.
 * - orchestrate repository calls.
 * - map missing/invalid data into HTTP exceptions.
 */
@Injectable()
export class AgentRunService {
  // MARK: - Constructor

  /**
   * Creates a new {@link AgentRunService}.
   *
   * @param agentsRepository - The repository for agents.
   * @param chatRepository - The repository for chats.
   */
  constructor(
    private readonly agentsRepository: AgentsRepository,
    private readonly chatRepository: ChatRepository,
  ) { }

  // MARK: - Instance methods

  /**
   * Runs an agent on a chat.
   *
   * @param agentId - The ID of the agent to run.
   * @param chatId - The ID of the chat to run the agent on.
   * @returns The response of the agent run.
   */
  async run(agentId: string, chatId: string): Promise<AgentRunResponseDto> {
    const agent = await this.agentsRepository.findById(agentId);

    if (!agent) throw new AgentNotFoundError();

    const chat = await this.chatRepository.findById(chatId);

    if (!chat) throw new ChatNotFoundError();

    return AgentRunResponseDto.from(agent, chat);
  }
}
