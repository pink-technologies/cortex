// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * How the kernel was invoked. Drives which fields in {@link ContextPayload} are relevant.
 * 
 * - **`chat`** — User message in a chat session; tie the run to a conversation via `chatId`.
 * - **`webhook`** — Event from an external system (GitHub, Stripe, …); describe it with
 *   `externalProvider`, `eventType`, and any extra payload fields.
 */
export enum SourceType {
    CHAT = 'chat',
    WEBHOOK = 'webhook',
}