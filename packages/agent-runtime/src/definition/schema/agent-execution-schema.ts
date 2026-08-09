// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import z from 'zod'

/**
 * Validates the execution limits declared by an agent manifest.
 */
export const agentExecutionSchema = z
  .object({
    /**
     * Maximum number of language-model iterations allowed during one agent
     * execution.
     */
    max_iterations: z
      .number()
      .int()
      .positive(),

    /**
     * Maximum total duration of an agent execution, in milliseconds.
     */
    timeout_ms: z
      .number()
      .int()
      .positive(),
  })
  .strict()

/**
 * Raw execution configuration parsed from an agent manifest.
 */
export type AgentExecutionManifest = z.infer<typeof agentExecutionSchema>