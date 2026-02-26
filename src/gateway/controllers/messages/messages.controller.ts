// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, Param, Post } from "@nestjs/common";

@Controller('/v1/chats/:chatId/messages')
export class MessagesController {
    // - MARK: - constructor

    constructor(private readonly messagesService: MessagesService) {}

    // MARK: - Instance methods

    @Post()
    async create(@Body('content') content: string, @Param('chatId') chatId: string) {
        return this.messagesService.create(content ?? '' );
    }

    async retrieve(@Param('chatId') chatId: string): Promise<Message[]> {
        return this.messagesService.retrieve(chatId);
    }
}