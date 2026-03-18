// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, Post } from "@nestjs/common";
import { ChatService } from "src/chats/service/chats.service";
import { ChatDto } from "@/chats/dto";

/**
 * Controller for chat operations.
 */
@Controller('/v1/chats')
export class ChatController {
    // - MARK: - constructor

    /**
     * Creates a new {@link ChatController}.
     *
     * @param chatService - The chat service.
     */
    constructor(private readonly chatService: ChatService) { }

    // MARK: - Instance methods

    /**
     * Creates a new chat.
     *
     * @param title - The title of the chat.
     * @returns The created chat as a response DTO.
     */
    @Post()
    async create(@Body('title') title?: string): Promise<ChatDto> {
        return this.chatService.create(title ?? '');
    }
}