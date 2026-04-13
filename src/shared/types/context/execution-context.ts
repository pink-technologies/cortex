// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Context for the execution of a kernel.
 */
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
     */
    readonly sessionId?: string;

    /**
     * Authenticated principal when the run is on behalf of a user (tools resolve per-user integrations).
     */
    readonly userId?: string;

    /**
     * Capability ids the **current** acting agent may use (from agent manifest, e.g. {@code agent.toml}).
     * Used by the kernel to coerce an mistaken **respond** into **use-capability** when the text clearly targets one of these ids.
     */
    readonly allowedCapabilityIds?: readonly string[];
}