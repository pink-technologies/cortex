// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionContext } from "@/shared/types";

/**
 * Pluggable unit that runs a single **capability** (tool, integration, or domain action)
 * given typed input and shared {@link ExecutionContext}.
 *
 * @typeParam Input - Payload specific to this capability (validated upstream when applicable).
 * @typeParam Output - Result type returned after execution (e.g. structured data, side-effect summary).
 *
 * Implementations are typically registered and invoked by orchestration (kernel, agents, or
 * capability registry) using {@link CapabilityExecutor.id} for lookup and routing.
 */
export interface CapabilityExecutor<Input = unknown, Output = unknown> {
    /**
     * Stable identifier for this executor.
     * Must be unique among capability executors in the same registry.
     */
    readonly id: string;

    /**
     * Runs the capability for the given input and execution scope.
     *
     * @param input - Capability-specific input; shape matches `Input`.
     * @param context - Shared run context (e.g. {@link ExecutionContext.executionId}, {@link ExecutionContext.message}).
     * @returns The capability result; shape matches `Output`.
     */
    execute(input: Input, context: ExecutionContext): Promise<Output>;
}