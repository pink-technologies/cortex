// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Agent } from '../agent';
import { AgentAlreadyRegisteredError } from '../error/error';

/**
 * DI token for the application {@link AgentRegistry}.
 *
 * Use with `inject` / `@Inject(AGENT_REGISTRY)` when wiring orchestration or the kernel
 * so agent lookup stays testable (swap with an in-memory or mock registry in tests).
 */
export const AGENT_REGISTRY = Symbol('AGENT_REGISTRY');

/**
 * Read/write registry of {@link Agent} instances keyed by {@link Agent.id}.
 *
 * Implementations may be in-memory, backed by config, or hydrated from persistence;
 * the interface keeps resolution behind a stable contract.
 */
export interface AgentRegistry {
    /**
     * Returns the agent for `id`, or `null` if none is registered.
     *
     * @param id - Same value as {@link Agent.id}.
     */
    get(id: string): Agent | null;

    /**
     * Registers an agent. Must not replace an existing id.
     *
     * @param agent - Agent to register; {@link Agent.id} becomes the registry key.
     * @throws {@link AgentAlreadyRegisteredError} when an agent with the same id is already present.
     */
    register(agent: Agent): void;
}

/**
 * In-memory {@link AgentRegistry} backed by a {@link Map}.
 *
 * Suitable for development, tests, or bootstrap-time registration of built-in agents.
 */
export class InMemoryAgentRegistry implements AgentRegistry {
    // MARK: - Constructor

    /**
     * @param agents - Optional pre-populated map (defaults to empty). Keys must match {@link Agent.id}.
     */
    constructor(private readonly agents: Map<string, Agent> = new Map()) {}

    // MARK: - AgentRegistry

    /**
     * Returns the agent for `id`, or `null` if none is registered.
     *
     * @param id - Same value as {@link Agent.id}.
     */
    get(id: string): Agent | null {
        const agent = this.agents.get(id);

        if (!agent) return null;

        return agent;
    }

    /**
     * Registers an agent. Must not replace an existing id.
     *
     * @param agent - Agent to register; {@link Agent.id} becomes the registry key.
     * @throws {@link AgentAlreadyRegisteredError} when an agent with the same id is already present.
     */
    register(agent: Agent): void {
        if (this.agents.has(agent.id)) throw new AgentAlreadyRegisteredError();

        this.agents.set(agent.id, agent);
    }
}