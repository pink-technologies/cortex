// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Request body for adding a message to a chat (HTTP boundary; validated by the global {@link ValidationPipe}).
 */
export class AddMessageParametersDto {
    /**
     * The content of the message.
     */
    @IsNotEmpty({ message: 'The message content is required.' })
    @IsString()
    content: string;
}