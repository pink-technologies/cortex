// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common";
import { Database } from "src/infraestructure/database";

@Injectable()
export class ChatService {
    // MARK: - Constructor

    constructor(private readonly database: Database) {}

    // MARK: - Instance methods

    async create(title: string): Promise<Chat> {
        const chat = this.database.chats.create({title})

        return chat
    }
}