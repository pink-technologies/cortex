// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { AgentExecuteJobPayloadSchema } from './agent-execute-job-payload'

/**
 * Validates the request body used to enqueue an `agent.execute` execution job.
 *
 * Accepted by the Cortex API when creating an agent execution. The control
 * plane persists an {@link ExecutionJob} with kind `"agent.execute"`, the
 * supplied {@link payload}, and queue {@link priority}. The schema is strict so
 * unknown properties fail closed and surface protocol drift between clients and
 * the API.
 *
 * Field semantics:
 * - `payload` — handler-specific input validated by
 *   {@link AgentExecuteJobPayloadSchema}
 * - `priority` — integer queue weight; higher values are preferred when Nodes
 *   claim jobs; defaults to `0` when omitted
 */
export const CreateAgentExecuteJobRequestSchema = z
  .object({
    /**
     * Handler-specific input for the `agent.execute` job.
     *
     * Must satisfy {@link AgentExecuteJobPayloadSchema} before the job is
     * accepted into the queue.
     */
    payload: AgentExecuteJobPayloadSchema,

    /**
     * Integer queue weight used when selecting the next available job.
     *
     * Higher values are preferred over lower ones during claim. Defaults to
     * `0` when omitted.
     */
    priority: z.number().int().default(0),
  })
  .strict()

/**
 * Validated request used to enqueue an `agent.execute` execution job.
 *
 * Derived from {@link CreateAgentExecuteJobRequestSchema} so runtime validation
 * and the TypeScript representation remain synchronized.
 */
export type CreateAgentExecuteJobRequest = z.infer<typeof CreateAgentExecuteJobRequestSchema>
