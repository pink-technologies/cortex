// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Worker-selection constraints for a job, persisted as `ExecutionJob.requirements` JSON.
 *
 * The scheduler matches these against worker capabilities and labels before leasing
 * an attempt.
 */
export interface ExecutionJobRequirements {
    /**
     * Capability ids the worker must expose (AND). Empty array means no required capabilities.
     */
    allOf: string[]

    /**
     * Capability ids of which the worker must expose at least one (OR).
     */
    anyOf?: string[]

    /**
     * Capability ids the worker must not expose (NOT).
     */
    noneOf?: string[]

    /**
     * Optional label filters the worker must satisfy (exact match semantics defined by the scheduler).
     */
    labels?: string[]
}
