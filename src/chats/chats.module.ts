// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { DatabaseModule } from '@/infraestructure/database';
import { Module } from '@nestjs/common';
import { ChatRepository, ChatService } from './index';
import { ChatController } from './controllers/chat.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ChatController],
  exports: [ChatRepository, ChatService],
  providers: [ChatRepository, ChatService],
})
export class ChatsModule { }
