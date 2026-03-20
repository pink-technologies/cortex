// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { ProcessKernelContextDto } from './process-kernel-context.dto';
import type { KernelInput } from '../input/kernel_input';

/**
 * Request body for kernel process endpoint (HTTP boundary; validated by the global {@link ValidationPipe}).
 */
export class ProcessKernelBodyDto {
    /**
     * The normalized payload to be processed by the kernel (e.g. message content, webhook body).
     */
    @IsNotEmpty({ message: 'The payload is required.' })
    @IsString()
    payload: string;

    /**
     * The contextual metadata associated with the payload.
     */
    @ValidateNested()
    @Type(() => ProcessKernelContextDto)
    @IsObject()
    context: ProcessKernelContextDto;

    /**
     * Converts this DTO to {@link KernelInput}.
     */
    toKernelInput(): KernelInput {
        return {
            payload: this.payload,
            context: {
                origin: this.context.origin,
                chatId: this.context.chatId,
                intent: this.context.intent,
                externalProvider: this.context.externalProvider,
                eventType: this.context.eventType,
                externalReference: this.context.externalReference,
            },
        };
    }
}
