// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Body for POST /v1/playground — local testing of {@link Kernel#process}.
 */
export class PlaygroundMessageDto {
    /**
     * User message to send through the default entry agent.
     */
    @IsString()
    @IsNotEmpty()
    message!: string;
}
