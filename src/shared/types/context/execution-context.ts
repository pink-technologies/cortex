// Copyright (c) 2026, PinkTech
// https://pink-tech.io/


export interface ExecutionContext {
    /**
     * Unique execution identifier.
     */
    readonly executionId: string;
  
    /**
     * Normalized user message.
     */
    readonly message: string;

    // installationId, workspaceId, userId, conversationId, etc.
    // installationConfig?
}