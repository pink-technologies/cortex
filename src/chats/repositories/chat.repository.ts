// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Chat } from '@prisma/client';
import { Database } from '@/infraestructure/database';

/**
 * Repository responsible for querying {@link Chat} entities.
 */
@Injectable()
export class ChatRepository {
  // MARK: - Constructor

  /**
   * Creates a new {@link ChatRepository}.
   *
   * @param database - The database client used to perform chat operations.
   * Injected at runtime to support inversion of control and enable testability.
   */
  constructor(private readonly database: Database) { }

  // MARK: - Instance methods

  /**
   * Creates a new chat with its first message.
   *
   * @param title - The title of the chat.
   * @param content - The content of the first message.
   * @returns The created chat.
   */
  async create(title: string, content: string): Promise<Chat> {
    return await this.database.chat.create({
      data: {
        title,
        messages: {
          create: {
            content,
            role: 'USER',
          },
        },
      },
    });
  }

  /**
   * Finds a chat by its ID.
   *
   * @param id - The ID of the chat.
   * @returns The found chat.
   */
  async findById(id: string): Promise<Chat | null> {
    return await this.database.chat.findUnique({ where: { id } });
  }
}
