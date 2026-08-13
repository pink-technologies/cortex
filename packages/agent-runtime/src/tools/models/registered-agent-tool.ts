// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ZodType } from 'zod'
import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import { type AgentToolMetadata } from './agent-tool-metadata'

/**
 * Represents a type-erased tool resolved from the tool registry.
 *
 * Agent tools declare strongly typed input and output values. The registry
 * erases those generic types because tools are selected dynamically by name
 * when requested by a language model.
 *
 * The tool executor validates unknown input with {@link inputSchema} before
 * invoking {@link execute} and validates the produced result with
 * {@link outputSchema} before returning it to the agent runtime.
 *
 * @typeParam Context - Runtime context required by the tool.
 */
export interface RegisteredAgentTool<Context extends AgentExecutionContext = AgentExecutionContext> {
  /**
   * Description presented to the language model.
   */
  readonly description: string

  /**
   * Schema used to validate model-generated input.
   */
  readonly inputSchema: ZodType<unknown>

  /**
   * Declarative policy metadata for authorization and orchestration.
   *
   * Not presented to the language model.
   */
  readonly metadata: AgentToolMetadata

  /**
   * Stable registered tool name.
   */
  readonly name: string

  /**
   * Schema used to validate tool-produced output.
   */
  readonly outputSchema: ZodType<unknown>

  /**
   * Executes the tool with previously validated input.
   *
   * @param input - Input previously validated with {@link inputSchema}.
   * @param context - Runtime information associated with the execution.
   * @returns The result produced by the tool.
   */
  execute(input: unknown, context: Context): Promise<unknown>
}
