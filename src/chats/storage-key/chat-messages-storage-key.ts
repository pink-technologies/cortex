// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Redis cache key for chat messages.
 */
export const key = (chatId: string): string => `chat:${chatId}:messages`;
