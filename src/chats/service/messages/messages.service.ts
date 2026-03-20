// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { ChatRepository } from '@/chats/index';
import { AddMessageParametersDto, MessageDto } from '@/chats/dto';
import { MessagesRepository } from '@/chats/repositories';
import { ChatNotFoundError } from '../error/chat.error';
import { RedisStorageService } from '@/infraestructure/storage/redis/redis-storage.service';
import { key } from '@/chats/storage-key/chat-messages-storage-key';

/**
 * Domain service for message read and write operations.
 *
 * Implements a cache-aside pattern with Redis to optimize frequent queries:
 * - **Read**: Checks cache first; on miss, loads from DB and populates the cache.
 * - **Write**: Persists to DB and updates the cache synchronously (write-through).
 *
 * @remarks
 * Cache keys follow the format `chat:{chatId}:messages` defined in
 * {@link chat-messages-storage-key}.
 *
 * @see {@link ChatRepository} - Chat existence validation.
 * @see {@link MessagesRepository} - Message persistence in DB.
 * @see {@link RedisStorageService} - Cache layer.
 */
@Injectable()
export class MessagesService {
    private readonly chatMessagesStorageKey = key;

    // MARK: - Constructor

    /**
     * Creates a new {@link MessagesService} instance.
     *
     * @param chatRepository - Repository for validating chat existence.
     * @param messagesRepository - Repository for persisting and querying messages.
     * @param redisStorageService - Redis cache service for messages per chat.
     */
    constructor(
        private readonly chatRepository: ChatRepository,
        private readonly messagesRepository: MessagesRepository,
        private readonly redisStorageService: RedisStorageService,
    ) { }

    // MARK: - Instance methods

    /**
     * Adds a new message to an existing chat.
     *
     * Flow:
     * 1. Validates that the chat exists.
     * 2. Persists the message to the DB.
     * 3. Updates the Redis cache (appends to existing list or creates a new one).
     *
     * @param parameters - Validated parameters: `chatId` and `content`.
     * @returns The created message as {@link MessageDto}.
     * @throws {@link ChatNotFoundError} If the chat does not exist.
     */
    async add(chatId: string, parameters: AddMessageParametersDto): Promise<MessageDto> {
        const chat = await this.chatRepository.findById(chatId);

        if (!chat) throw new ChatNotFoundError();

        const message = await this.messagesRepository.add(chatId, parameters.content);
        const messageDto = MessageDto.from(message);

        const chatMessagesStorageKey = this.chatMessagesStorageKey(chatId);
        const cached = await this.redisStorageService.read<MessageDto[]>(chatMessagesStorageKey);
        const updated = cached ? [...cached, messageDto] : [messageDto];

        await this.redisStorageService.write(updated, chatMessagesStorageKey);

        return messageDto;
    }

    /**
     * Retrieves all messages for a chat.
     *
     * Uses read-through pattern: checks Redis first; on cache miss, loads from DB
     * and stores the result in cache for future requests.
     *
     * @param chatId - The chat identifier.
     * @returns List of messages as {@link MessageDto[]}, ordered by creation.
     * @throws {@link ChatNotFoundError} If the chat does not exist.
     */
    async findByChatId(chatId: string): Promise<MessageDto[]> {
        const chat = await this.chatRepository.findById(chatId);

        if (!chat) throw new ChatNotFoundError();

        const chatMessagesStorageKey = this.chatMessagesStorageKey(chatId);
        const cached = await this.redisStorageService.read<MessageDto[]>(chatMessagesStorageKey);

        if (cached) return cached;

        const messages = await this.messagesRepository.findByChatId(chatId);
        const messageDtos = messages.map(MessageDto.from);

        await this.redisStorageService.write(messageDtos, chatMessagesStorageKey);

        return messageDtos;
    }
}
