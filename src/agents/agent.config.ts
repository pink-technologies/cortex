// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentDescriptor } from "./agent";
import { LLM } from "@/llm";

/**
 * Static wiring for {@link PromptDrivenAgent}: identity, system prompt, LLM port, and delegation.
 */
export interface AgentConfiguration {
    /**
     * The id of the agent.
     */
    readonly id: string;

    /**
     * The descriptor of the agent.
     */
    readonly descriptor: AgentDescriptor;

    /**
     * The system prompt of the agent.
     */
    readonly systemPrompt: string;

    /**
     * The LLM of the agent.
     */
    readonly llm: LLM;

    /**
     * The delegate agent ids of the agent.
     */
    readonly delegateAgentIds?: readonly string[];
}