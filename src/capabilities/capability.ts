// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { CapabilityExecutor } from "./executors/capability-executor";

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
