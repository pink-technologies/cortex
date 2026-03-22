// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ExecutionContext } from "@/shared/types";

/**
 * Pluggable unit that runs a **skill** — a named behavior the agent or orchestrator can
 * invoke (e.g. from tool routing, skill manifests, or capability bundles).
 *
 * Skills typically wrap a narrower operation than a full capability domain: one skill,
 * one contract (`Input` → `Output`), with shared {@link ExecutionContext} for tracing
 * and user/session-scoped data.
 *
 * @typeParam Input - Skill-specific arguments (validated by the caller or a pipe when applicable).
 * @typeParam Output - Result returned to the caller (structured payload, text, or void-equivalent).
 *
 * Register implementations by {@link SkillExecutor.id} so the skill layer can resolve
 * and dispatch at runtime.
 */
export interface SkillExecutor<Input = unknown, Output = unknown> {
    /**
     * Stable identifier for this skill executor.
     * Must be unique among skill executors in the same registry.
     */
    readonly id: string;

    /**
     * Executes the skill for the given input and execution scope.
     *
     * @param input - Skill-specific input; shape matches `Input`.
     * @param context - Shared run context (e.g. {@link ExecutionContext.executionId}, {@link ExecutionContext.message}).
     * @returns The skill result; shape matches `Output`.
     */
    execute(input: Input, context: ExecutionContext): Promise<Output>;
}