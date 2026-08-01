// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Discriminator value for execution jobs that run a registered Cortex agent.
 *
 * Set as {@link ExecutionJob.kind} when enqueueing or claiming an agent run.
 * Workers switch on this constant to validate {@link ExecutionJob.payload}
 * with {@link AgentExecuteJobPayloadSchema} and to interpret the job outcome
 * as {@link AgentExecuteJobResultSchema}.
 *
 * Prefer comparing against this export instead of hard-coding `"agent.execute"`
 * so renames and refactors stay type-safe across API and Node packages.
 */
export const AgentExecuteJobKind = 'agent.execute' as const

/**
 * Literal job-kind type for agent executions (`"agent.execute"`).
 *
 * Derived from {@link AgentExecuteJobKind} so the compile-time union member
 * stays aligned with the runtime constant.
 */
export type AgentExecuteJobKind = typeof AgentExecuteJobKind
