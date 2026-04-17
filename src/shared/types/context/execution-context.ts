// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ConversationMessage } from '../input/execution-input';

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

    /**
     * Prior turns for this session (excluding the current {@link message} when built like {@link PlaygroundService}).
     * Skills such as {@code text.summarize} may use this when the latest line is a short follow-up (e.g. “resume lo anterior”).
     */
    readonly conversationHistory?: readonly ConversationMessage[];

    /**
     * Persisted chat / session id when applicable.
     */
    readonly sessionId?: string;

    /**
     * Authenticated principal when the run is on behalf of a user (tools resolve per-user integrations).
     */
    readonly userId?: string;

    /**
     * Skill ids the **current** acting agent may use (from agent manifest, e.g. {@code agent.toml}).
     * Used by the kernel to coerce an mistaken **respond** into **use-skill** when the text clearly targets one of these ids.
     */
    readonly allowedSkillIds?: readonly string[];

    /**
     * Capability ids the **current** acting agent may use (from agent manifest, e.g. {@code agent.toml}).
     * Used by the kernel to coerce an mistaken **respond** into **use-capability** when the text clearly targets one of these ids.
     */
    readonly allowedCapabilityIds?: readonly string[];

    /**
     * The id of the current acting agent.
     */
    readonly agentId: string;
}