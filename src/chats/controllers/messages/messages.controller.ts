// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ChatExceptionFilter } from "@/chats/filter/exception.filter";
import { MessagesService } from "src/chats/service/messages/messages.service";
import { AddMessageParametersDto, MessageDto } from "@/chats/dto";
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    UseFilters,
} from "@nestjs/common";

/**
 * HTTP controller responsible for handling message-related read requests.
 *
 * This controller acts as the transport-layer entry point for message
 * operations and delegates all business logic to the {@link MessagesService}.
 */
@Controller('/v1/chats')
@UseFilters(ChatExceptionFilter)
export class MessagesController {
    // - MARK: - constructor

    /**
     * Creates a new {@link MessagesController}.
     *
     * @param messagesService - The messages service.
     */
    constructor(private readonly messagesService: MessagesService) { }

    // MARK: - Instance methods

    /**
     * Adds a new message to a chat.
     *
     * @param parameters - The parameters for the message addition.
     * @returns The created message as a response DTO.
     */
    @Post(':chatId/messages')
    async add(
        @Param('chatId') chatId: string,
        @Body() parameters: AddMessageParametersDto,
    ): Promise<MessageDto> {
        return this.messagesService.add(chatId, parameters);
    }

    /**
     * Finds messages by chat ID.
     *
     * @param chatId - The ID of the chat.
     * @returns The found messages as a response DTO.
     */
    @Get(':chatId/messages')
    async findByChatId(@Param('chatId') chatId: string): Promise<MessageDto[]> {
        return this.messagesService.findByChatId(chatId);
    }
}