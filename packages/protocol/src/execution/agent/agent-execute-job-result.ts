// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates aggregate token accounting for an `agent.execute` run.
 *
 * Counts are non-negative integers summed across every LLM turn that
 * contributed to the job. The schema is strict so unknown usage fields fail
 * closed between API and workers.
 */
export const AgentExecuteJobUsageSchema = z
  .object({
    /**
     * Total prompt / input tokens charged across all turns.
     */
    inputTokens: z.number().int().nonnegative(),

    /**
     * Total completion / output tokens charged across all turns.
     */
    outputTokens: z.number().int().nonnegative(),

    /**
     * Combined input and output token count for the execution.
     */
    totalTokens: z.number().int().nonnegative(),
  })
  .strict()

/**
 * Validated token usage for an `agent.execute` job.
 *
 * Derived from {@link AgentExecuteJobUsageSchema} so runtime validation and the
 * TypeScript representation remain synchronized.
 */
export type AgentExecuteJobUsage = z.infer<typeof AgentExecuteJobUsageSchema>

/**
 * Validates the handler result for a completed `agent.execute` execution job.
 *
 * Produced by a Node after successfully running the agent described by
 * {@link AgentExecuteJobPayloadSchema}. Callers persist or return this object as
 * the job outcome; it is not the claim/complete transport envelope itself.
 * The schema is strict so unknown properties fail closed and surface protocol
 * drift.
 *
 * Field semantics:
 * - `executionId` — runtime correlation id for the agent run
 * - `iterationCount` — number of LLM turns consumed (`>= 1`)
 * - `output` — final agent text (may be empty when the model returns none)
 * - `usage` — aggregate token totals for the run
 */
export const AgentExecuteJobResultSchema = z
  .object({
    /**
     * Identifier assigned by the runtime to correlate this agent execution.
     *
     * Distinct from the enclosing {@link ExecutionJob.id}; use this value to
     * join logs, traces, and follow-up requests for the same run.
     */
    executionId: z.string().trim().min(1),

    /**
     * Number of LLM turns consumed while producing {@link output}.
     *
     * Always a positive integer; a completed job performed at least one turn.
     */
    iterationCount: z.number().int().positive(),

    /**
     * Final text returned by the agent after the last turn.
     *
     * Empty string is allowed when the model completes without textual content.
     */
    output: z.string(),

    /**
     * Aggregate token usage across every turn of the execution.
     */
    usage: AgentExecuteJobUsageSchema,
  })
  .strict()

/**
 * Validated `agent.execute` job result exchanged through the shared protocol.
 *
 * Derived from {@link AgentExecuteJobResultSchema} so runtime validation and
 * the TypeScript representation remain synchronized.
 */
export type AgentExecuteJobResult = z.infer<typeof AgentExecuteJobResultSchema>
