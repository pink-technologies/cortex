// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { CreateCardTool } from "./catalog/trello/create-card/create-card.tool";
import { TrelloClient } from "./clients/trello-client";
import { ToolRegistryService } from "./services/registry/tool-registry.service";
import { ToolBootstrapService } from "./services/tool-bootstrap.service";
import { TrelloAPIKeyNotConfiguredError, TrelloTokenNotConfiguredError } from "./catalog/trello/error/trello.error";

const TRELLO_API_KEY_ENV = 'TRELLO_API_KEY';
const TRELLO_TOKEN_ENV = 'TRELLO_TOKEN';

@Module({
    imports: [ConfigModule],
    exports: [ToolRegistryService],
    providers: [
        ToolRegistryService,
        {
            provide: TrelloClient,
            inject: [ConfigService],
            useFactory: (config: ConfigService): TrelloClient => {
                const apiKey = config.get<string>(TRELLO_API_KEY_ENV)?.trim();

                if (!apiKey) throw new TrelloAPIKeyNotConfiguredError();

                const token = config.get<string>(TRELLO_TOKEN_ENV)?.trim();

                if (!token) throw new TrelloTokenNotConfiguredError()

                return new TrelloClient(apiKey, token);
            },
        },
        CreateCardTool,
        ToolBootstrapService,
    ],
})
export class ToolsModule { }
