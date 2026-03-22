// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Terminal output of a kernel run: what to show the user (or caller) for one
 * {@link ExecutionInput} / execution, after agents and decisions have finished.
 *
 * Produced by {@link Kernel} / {@link DecisionExecutor} when a **respond**-style path
 * wins, or when a fallback message is synthesized. The same `executionId` should appear
 * in logs and nested agent hops for this request.
 */
export interface KernelResult {
    /**
     * Correlates this result with the originating execution (e.g. UUID/ULID from the entrypoint).
     *
     * Propagate to logs and nested calls so a single user request can be traced across
     * agents, skills, and repositories.
     */
    readonly executionId: string;

    /**
     * User-facing (or API-facing) reply text for this run.
     *
     * Typically the **respond** branch of {@link AgentDecision}; may also be an error
     * or fallback string when the kernel cannot produce a richer result.
     */
    readonly message: string;
}