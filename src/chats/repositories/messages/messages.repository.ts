// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { Database } from '@/infraestructure/database';

/**
 * Repository responsible for querying {@link Message} entities.
 */
@Injectable()
export class MessagesRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link MessagesRepository}.
     *
     * @param database - The database client used to perform message operations.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods

    /**
     * Add a new message to a chat.
     *
     * @param chatId - The ID of the chat.
     * @param content - The content of the message.
     * @returns The created message.
     */
    async add(chatId: string, content: string): Promise<Message> {
        return this.database.message.create({
            data: {
                chatId,
                content,
                role: 'USER',
            },
        });
    }

    /**
     * Finds messages by chat ID, ordered by creation ascending.
     *
     * @param chatId - The ID of the chat.
     * @returns The found messages, ordered by {@link Message.createdAt}.
     */
    async findByChatId(chatId: string): Promise<Message[]> {
        return this.database.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'asc' },
        });
    }
}
