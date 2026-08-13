// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ZodType } from 'zod'
import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import { type AgentToolMetadata } from './agent-tool-metadata'

/**
 * Represents a tool that may be exposed to and requested by an agent.
 *
 * A tool declares the schema used to validate model-generated input and
 * performs one runtime operation. Tool discovery, authorization, validation,
 * execution, and result serialization belong to the agent runtime.
 *
 * @typeParam Input - Validated input accepted by the tool.
 * @typeParam Output - Result produced by the tool.
 * @typeParam Context - Runtime context required by the tool.
 */
export interface AgentTool<Input, Output, Context extends AgentExecutionContext = AgentExecutionContext> {
  /**
   * Description presented to the language model.
   *
   * The description should explain what the tool does and when it should be
   * used.
   */
  readonly description: string

  /**
   * Schema used to validate model-generated tool input.
   *
   * The tool executor must validate unknown input with this schema before
   * invoking {@link execute}.
   */
  readonly inputSchema: ZodType<Input>

  /**
   * Declarative policy metadata for authorization and orchestration.
   *
   * Not presented to the language model.
   */
  readonly metadata: AgentToolMetadata

  /**
   * Stable name used to register and request the tool.
   *
   * Tool names should use a namespaced identifier, such as `test.add` or
   * `filesystem.read`.
   */
  readonly name: string

  /**
   * Schema describing the value returned by {@link execute}.
   *
   * Used for validation and structured serialization of tool results.
   */
  readonly outputSchema: ZodType<Output>

  /**
   * Executes the tool with previously validated input.
   *
   * The runtime must not call this method until the input has passed
   * {@link inputSchema} validation.
   *
   * @param input - Validated tool input.
   * @param context - Runtime information associated with the execution.
   * @returns The result produced by the tool.
   */
  execute(input: Input, context: Context): Promise<Output>
}
