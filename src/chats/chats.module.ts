// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { DatabaseModule } from '@/infraestructure/database';
import { Module } from '@nestjs/common';
import {
  ChatController,
  ChatRepository,
  ChatService,
  MessagesController,
  MessagesRepository,
  MessagesService,
} from './index';

@Module({
  imports: [DatabaseModule],
  controllers: [
    ChatController,
    MessagesController,
  ],
  exports: [
    ChatRepository,
    ChatService,
    MessagesRepository,
    MessagesService,
  ],
  providers: [
    ChatRepository,
    ChatService,
    MessagesRepository,
    MessagesService,
  ],
})
export class ChatsModule { }
