// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { ChatRepository } from '@/chats/index';
import { ChatDto } from '../dto';
import { ChatNotFoundError } from './error/chat.error';

/**
 * Service responsible for chat read and write use-cases.
 *
 * Responsibilities:
 * - validate input for read and write operations.
 * - orchestrate repository calls.
 * - map missing/invalid data into HTTP exceptions.
 */
@Injectable()
export class ChatService {
  // MARK: - Constructor

  constructor(private readonly chatRepository: ChatRepository) { }

  // MARK: - Instance methods

  /**
   * Creates a new chat.
   *
   * @param title - The title of the chat.
   * @returns The created chat as a response DTO.
   */
  async create(title: string): Promise<ChatDto> {
    const chat = await this.chatRepository.create(title);

    return ChatDto.from(chat);
  }

  /**
   * Finds a chat by its ID.
   *
   * @param id - The ID of the chat.
   * @returns The found chat as a response DTO.
   * @throws ChatNotFoundError when the chat cannot be found.
   */
  async findById(id: string): Promise<ChatDto> {
    const chat = await this.chatRepository.findById(id);

    if (!chat) throw new ChatNotFoundError();

    return ChatDto.from(chat);
  }
}
