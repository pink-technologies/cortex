// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionContext } from '@/shared/types/context/execution-context';
import { CapabilityExecutor } from './executors/capability-executor';

/**
 * Type guard: true when the given value exposes the {@link CapabilityContractProvider}
 * surface (used by the registry to opt-in capabilities that can self-describe).
 *
 * @param value - Candidate object, typically a {@link CapabilityExecutor}.
 * @returns Whether {@code value} implements {@link CapabilityContractProvider}.
 */
export const capabilityContractProvider = (
    value: unknown,
): value is CapabilityContractProvider => {
    if (typeof value !== 'object' || value === null) return false;

    const partial = value as Partial<CapabilityContractProvider>;

    return (
        typeof partial.id === 'string' && typeof partial.describe === 'function'
    );
};

/**
 * A factory for a capability executor.
 */
export type CapabilityFactory = () => CapabilityExecutor;

/**
 * A registered capability: stable id.
 *
 * Implementations are stored in {@link CapabilityRegistry} and invoked by the kernel or orchestrator
 * after resolving which capability should act.
 */
export interface CapabilityEntry {
    /**
     * The id of the capability.
     */
    id: string;

    /**
     * The factory of the capability.
     */
    factory: () => CapabilityFactory;
}

/**
 * A registered capability: stable id.
 *
 * Implementations are stored in {@link CapabilityRegistry} and invoked by the kernel or orchestrator
 * after resolving which capability should act.
 */
export interface Capability {
    /**
     * Stable key used in {@link CapabilityRegistry}.
     */
    readonly id: string;

    /**
     * Display name from bundled `capability.toml` (see {@link CapabilityService}).
     */
    readonly name?: string;

    /**
     * Short description from bundled `capability.toml`.
     */
    readonly description?: string;

    /**
     * Tool ids this capability may route to (from `capability.toml`).
     */
    readonly tools?: readonly string[];
}

/**
 * One LLM-callable operation exposed by a capability.
 *
 * Materialized inside {@link CapabilityDescription.actions} and consumed by
 * prompt-driven agents so the LLM can reason about which action to invoke
 * and how to shape its input.
 */
export interface CapabilityAction {
    /**
     * Stable action key (e.g. {@code "load"}); matches one of the
     * {@code actions} listed in the capability's bundled manifest.
     */
    readonly name: string;

    /**
     * Short, model-facing summary of when this action is
     * appropriate and what it returns.
     */
    readonly description: string;

    /**
     * Schema describing the
     * action's input payload. Typically derived from the same schema used
     * to validate inputs in {@link CapabilityExecutor.execute}.
     */
    readonly inputSchema: unknown;

    /**
     * Optional natural-language rules or constraints the
     * LLM should respect (e.g. {@code "Always include a limit"}).
     */
    readonly rules?: readonly string[];
}

/**
 * Live, machine-readable description of one capability, intended for
 * consumption by prompt-driven agents.
 *
 * Unlike a static manifest, a {@link CapabilityDescription} may carry
 * a {@link runtimeContext} payload that reflects the capability's current
 * contract with the outside world (e.g. the live semantic model of an
 * analytics provider, the available channels on a chat integration). The
 * producing {@link CapabilityContractProvider} is free to compute it on demand or
 * read it from cache.
 */
export interface CapabilityDescription {
    /**
     * The set of operations the agent may invoke via
     * {@link AgentDecisionType.UseCapability}.
     */
    readonly actions: readonly CapabilityAction[];

    /**
     * Stable capability id, matching {@link CapabilityExecutor.id}
     * and the manifest {@code id}.
     */
    readonly id: string;

    /**
     * One-paragraph description of what this capability does,
     * suitable for direct injection into an LLM prompt.
     */
    readonly summary: string;

    /**
     * Optional, capability-specific payload describing
     * live state the LLM needs (e.g. the projected Cube semantic model for
     * Cube). Opaque to the agent layer; only the producing capability and
     * its contract provider interpret its shape.
     */
    readonly runtimeContext?: unknown;
}

/**
 * Port implemented by {@link CapabilityExecutor}s whose contract may evolve
 * at runtime and therefore cannot be fully captured in a static manifest.
 *
 * The orchestrator (kernel / decision executor) queries each registered
 * describer before invoking the agent so the LLM sees the current contract
 * instead of a hardcoded snapshot from the agent's prompt.
 *
 * Implementations are typically the same class as the matching
 * {@link CapabilityExecutor}, exposing both ports on a single instance so
 * the contract provider and the executor share dependencies (e.g. one Cube client,
 * one cache).
 *
 * Implementations MUST be safe to call repeatedly: each {@link describe}
 * invocation is expected to be cheap (cache-aside) and side-effect-free.
 */
export interface CapabilityContractProvider {
    /**
     * Stable identifier for this describer.
     *
     * Must match the {@link CapabilityExecutor.id} of the corresponding
     * executor so the registry can pair them.
     */
    readonly id: string;

    /**
     * Produces a fresh {@link CapabilityDescription} for the current run.
     *
     * @param context - Shared execution scope (e.g. {@link ExecutionContext.userId},
     *   {@link ExecutionContext.sessionId}) for capabilities whose contract
     *   varies per tenant / per user. Capabilities with a global contract may
     *   ignore the parameter.
     * @returns The capability's live description.
     */
    describe(context: ExecutionContext): Promise<CapabilityDescription>;
}
