// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { MessageRole } from "@/llm/llm";

/**
 * How the kernel was invoked. Drives which fields in {@link ContextPayload} are relevant.
 * 
 * - **`chat`** — User message in a chat session; tie the run to a conversation via `chatId`.
 * - **`webhook`** — Event from an external system (GitHub, Stripe, …); describe it with
 *   `externalProvider`, `eventType`, and any extra payload fields.
 */
export const OriginType = { CHAT: 'chat', WEBHOOK: 'webhook' } as const;

/**
 * Origin that produced this normalized request.
 * Examples: 'chat', 'api', 'voice'
 */
export type OriginType = (typeof OriginType)[keyof typeof OriginType];

/**
 * One turn in a chat thread for LLM replay (user / assistant text only).
 */
export interface ConversationMessage {
    /**
     * The role of the message.
     */
    readonly role: MessageRole;

    /**
     * The content of the message.
     */
    readonly content: string;
}

/**
 * Input passed to the entrypoint.
 *
 * `ExecutionInput` contains the normalized payload to process and the
 * contextual metadata required to resolve the target agent and execution path.
 */
export interface ExecutionInput {
    /** 
     * Message content.
     */
    readonly message: string;

    /**
     * Origin that produced this normalized request.
     * Examples: 'chat', 'api', 'voice'
     */
    readonly origin: OriginType;

    /**
     * Stable conversation id (e.g. Prisma `Chat.id`) when the run is tied to a persisted session.
     */
    readonly sessionId?: string;

    /**
     * Authenticated user id when tools must use per-user credentials (e.g. Trello per connection).
     */
    readonly userId?: string;

    /**
     * Full thread for LLM replay (same shape as {@link ConversationMessage}).
     */
    readonly conversationHistory?: readonly ConversationMessage[];
}