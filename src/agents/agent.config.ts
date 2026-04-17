// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentDescriptor } from "./agent";
import type { LLM, LLMModel } from "@/llm";

/**
 * Static wiring for a {@link PromptDrivenAgent}: identity, persona, LLM port, prompt text, and optional delegates.
 *
 * Built by {@link AgentService} from bundled `agent.toml` (and the referenced prompt file), not registered as a Nest provider.
 */
export interface AgentConfiguration {
    /**
     * Stable key for storage and {@link AgentDecision} delegation; matches manifest `id` (`agent.toml`).
     */
    readonly id: string;

    /**
     * Display name, {@link AgentDescriptor.role | role}, allowed skills, capabilities, and description for prompts / routing.
     */
    readonly descriptor: AgentDescriptor;

    /**
     * Port used by {@link PromptDrivenAgent.decide} for the structured JSON {@link AgentDecision} call (e.g. OpenAI-backed client).
     */
    readonly llm: LLM;

    /**
     * Chat model id for {@link PromptDrivenAgent.decide} (typically the app default from `LLM_DEFAULT_MODEL`).
     */
    readonly model: LLMModel;

    /**
     * Agent ids this instance may hand off to via **delegate**; listed in the user prompt as available delegates.
     * Omitted or empty when the agent never delegates. Matches manifest `delegates_to` when present.
     */
    readonly delegateAgentIds?: readonly string[];

    /**
     * System instructions prepended to the LLM for every {@link PromptDrivenAgent.decide} call; loaded from the manifest’s prompt file.
     */
    readonly systemPrompt: string;
}