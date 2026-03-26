// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

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
}
