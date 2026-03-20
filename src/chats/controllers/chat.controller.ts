// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, Get, HttpCode, Param, Post, UseFilters } from "@nestjs/common";
import { ChatService } from "src/chats/service/chats.service";
import { ChatDto, CreateChatParametersDto } from "@/chats/dto";
import { ChatsExceptionFilter } from "../filter/exception.filter";

/**
 * HTTP controller responsible for handling chat-related read requests.
 *
 * This controller acts as the transport-layer entry point for chat
 * operations and delegates all business logic to the {@link ChatService}.
 */
@Controller('/v1/chats')
@UseFilters(ChatsExceptionFilter)
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
    async create(@Body() parameters: CreateChatParametersDto): Promise<ChatDto> {
        return this.chatService.create(parameters);
    }

    /**
     * Finds a chat by its ID.
     *
     * @param id - The ID of the chat.
     * @returns The found chat as a response DTO.
     */
    @Get(':id')
    @HttpCode(200)
    async findById(@Param('id') id: string): Promise<ChatDto> {
        return this.chatService.findById(id);
    }
}