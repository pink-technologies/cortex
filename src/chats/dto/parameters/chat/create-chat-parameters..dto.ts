// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { CreateMessageParametersDto } from '@/chats/dto/parameters/messages/create-message-parameters.dto';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

/**
 * Request body for creating a chat (HTTP boundary; validated by the global {@link ValidationPipe}).
 */
export class CreateChatParametersDto {
  /**
   * The title of the chat.
   */
  @IsNotEmpty({ message: 'The chat title is required.' })
  @IsString()
  title: string;

  /**
   * The message to be added to the chat.
   */
  @IsNotEmpty({ message: 'The message is required.' })
  @IsObject()
  message: CreateMessageParametersDto;
}