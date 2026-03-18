// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ChatDto } from '@/chats/dto/chat/chat.dto';
import { Agent, Chat } from 'src/infraestructure/database';

/**
 * Data Transfer Object for the response of an agent run.
 *
 * Exposes a read-only view of the agent and the chat context
 * where the run was executed, suitable for API responses.
 */
export class AgentRunResponseDto {
  /**
   * Unique identifier of the agent.
   */
  readonly id: string;

  /**
   * Human-readable name of the agent.
   */
  readonly name: string;

  /**
   * Optional description of the agent.
   */
  readonly description: string | null;

  /**
   * Current status of the agent (e.g. ACTIVE, DEPRECATED).
   */
  readonly status: string;

  /**
   * Date and time when the agent was created.
   */
  readonly createdAt: Date;

  /**
   * Date and time when the agent was last updated.
   */
  readonly updatedAt: Date;

  /**
   * Chat context where the agent was run.
   */
  readonly chat: ChatDto;

  // Static methods

  /**
   * Creates an {@link AgentRunResponseDto} from domain-level {@link Agent} and {@link Chat}.
   *
   * @param agent - The domain agent entity from the database layer.
   * @param chat - The domain chat entity from the database layer.
   * @returns A response DTO suitable for API responses.
   */
  static from(agent: Agent, chat: Chat): AgentRunResponseDto {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      chat: ChatDto.from(chat),
    };
  }
}
