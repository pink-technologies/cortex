// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates the handler-specific payload for an `agent.execute` execution job.
 *
 * When an {@link ExecutionJob} has `kind` `"agent.execute"`, its opaque
 * {@link ExecutionJob.payload} must satisfy this schema before a Node runs the
 * agent. The schema is strict so unknown properties fail closed and surface
 * protocol drift between the API and workers.
 *
 * Field semantics:
 * - `agentId` — stable identifier of a registered agent definition on the Node
 * - `input` — non-empty user text presented as the agent turn input
 * - `toolNames` — allowlisted tool names for this run; omit or pass `[]` to
 *   deny all tools
 */
export const AgentExecuteJobPayloadSchema = z
  .object({
    /**
     * Identifier of the registered agent that will execute the request.
     *
     * Must match an agent definition known to the claiming Node's registry.
     */
    agentId: z.string().trim().min(1),

    /**
     * Non-empty user input presented to the agent for this execution.
     */
    input: z.string().trim().min(1),

    /**
     * Names of tools the agent may invoke during this execution.
     *
     * Defaults to an empty array when omitted. An empty collection means the
     * agent cannot call tools for this job.
     */
    toolNames: z.array(z.string().trim().min(1)).default([]),
  })
  .strict()

/**
 * Validated `agent.execute` job payload exchanged through the shared protocol.
 *
 * Derived from {@link AgentExecuteJobPayloadSchema} so runtime validation and
 * the TypeScript representation remain synchronized.
 */
export type AgentExecuteJobPayload = z.infer<typeof AgentExecuteJobPayloadSchema>
