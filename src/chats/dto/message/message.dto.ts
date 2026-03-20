// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Message } from 'src/infraestructure/database';

/**
 * Data transfer object for a message.
 */
export class MessageDto {
    /**
     * Unique identifier of the message.
     */
    readonly id: string;

    /**
     * Date and time when the message was created.
     */
    readonly createdAt: Date;

    /**
     * Content of the message.
     */
    readonly content: string;

    /**
     * Date and time when the message was last updated.
     */
    readonly updatedAt: Date;

    // Static methods

    /**
     * Creates a {@link MessageDto} from a domain-level {@link Message}.
     *
     * This method acts as a mapping boundary between the domain
     * entity and the API response layer.
     *
     * @param message - The domain message entity from the database layer.
     * @returns A response DTO suitable for API responses.
     */
    static from(message: Message): MessageDto {
        return {
            id: message.id,
            createdAt: message.createdAt,
            content: message.content,
            updatedAt: message.updatedAt,
        };
    }
}
