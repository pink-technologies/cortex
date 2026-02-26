// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, Post } from "@nestjs/common";
import { ChatService } from "src/chats/service/chats.service";

@Controller('/v1/chats')
export class ChatController {
    // - MARK: - constructor

    constructor(private readonly chatService: ChatService) {}

    // MARK: - Instance methods

    @Post()
    async create(@Body('title') title?: string) {
        return this.chatService.create(title ?? '' );
    }
}