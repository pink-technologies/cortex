// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Chat } from 'src/infraestructure/database';

/**
 * Data transfer object for a chat.
 */
export class ChatDto {
  /**
   * Unique identifier of the chat.
   */
  readonly id: string;

  /**
   * Date and time when the chat was created.
   */
  readonly createdAt: Date;

  /**
   * Title of the chat.
   */
  readonly title?: string | null;

  /**
   * Date and time when the chat was last updated.
   */
  readonly updatedAt: Date;

  // Static methods

  /**
   * Creates a {@link ChatDto} from a domain-level {@link Chat}.
   *
   * This method acts as a mapping boundary between the domain
   * entity and the API response layer.
   *
   * @param chat - The domain chat entity from the database layer.
   * @returns A response DTO suitable for API responses.
   */
  static from(chat: Chat): ChatDto {
    return {
      id: chat.id,
      createdAt: chat.createdAt,
      title: chat.title ?? '',
      updatedAt: chat.updatedAt,
    };
  }
}
