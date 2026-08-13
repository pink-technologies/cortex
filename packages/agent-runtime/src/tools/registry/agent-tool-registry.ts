// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import z, { type ZodType } from 'zod'
import { type LLMToolDefinition } from '@cortex/llm'
import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import { AgentToolAlreadyRegisteredError, AgentToolNotFoundError } from '@/tools/error/error'
import type { AgentTool } from '@/tools/models/agent-tool'
import type { RegisteredAgentTool } from '@/tools/models'

/**
 * Stores and resolves tools available to the agent runtime.
 *
 * Tools are indexed by their stable names. Registration erases each tool's
 * input and output generic types because tools are requested dynamically by
 * language-model-generated tool calls.
 *
 * @typeParam Context - Runtime context supported by registered tools.
 */
export class AgentToolRegistry<Context extends AgentExecutionContext = AgentExecutionContext> {
  // MARK: - Private Properties

  private readonly tools = new Map<string, RegisteredAgentTool<Context>>()

  // MARK: - Computed Properties

  /**
   * Number of tools currently registered.
   */
  get count(): number {
    return this.tools.size
  }

  // MARK: - Instance methods

  /**
   * Returns language-model definitions for every registered tool.
   *
   * Definitions follow registration order from {@link values}. Each entry
   * exposes the tool name, description, and JSON Schema for the input
   * parameters derived from the tool's input schema.
   *
   * @returns Language-model tool definitions for all registered tools.
   */
  definitions(): readonly LLMToolDefinition[] {
    return this.values().map((tool) => ({
      description: tool.description,
      name: tool.name,
      parameters: z.toJSONSchema(tool.inputSchema, {
        io: 'input',
      }),
    }))
  }

  /**
   * Returns language-model definitions for the specified registered tools.
   *
   * Definitions are returned in the same order as the provided names. Every
   * requested name must resolve to a registered executable tool.
   *
   * @param names - Names of the tools to expose to the language model.
   * @returns The corresponding language-model tool definitions.
   * @throws {@link AgentToolNotFoundError} when a requested tool is not registered.
   */
  definitionsFor(names: readonly string[]): readonly LLMToolDefinition[] {
    const definitions: LLMToolDefinition[] = []

    for (const name of names) {
      const tool = this.resolve(name)
      const toolDefinition: LLMToolDefinition = {
        description: tool.description,
        name: tool.name,
        parameters: z.toJSONSchema(tool.inputSchema, {
          io: 'input',
        }),
      }

      definitions.push(toolDefinition)
    }

    return definitions
  }

  /**
   * Determines whether a tool is registered.
   *
   * @param name - Stable name of the tool.
   * @returns `true` when the tool is registered.
   */
  has(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * Registers the specified tool.
   *
   * @param tool - Tool to register.
   * @throws {@link AgentToolAlreadyRegisteredError} when another tool uses the
   * same name.
   */
  register<Input, Output>(tool: AgentTool<Input, Output, Context>): void {
    if (this.tools.has(tool.name)) {
      throw new AgentToolAlreadyRegisteredError(tool.name)
    }

    this.tools.set(tool.name, this.erase(tool))
  }

  /**
   * Resolves a registered tool by name.
   *
   * @param name - Stable name of the requested tool.
   * @returns The registered tool.
   * @throws {@link AgentToolNotFoundError} when no tool uses the requested
   * name.
   */
  resolve(name: string): RegisteredAgentTool<Context> {
    const tool = this.tools.get(name)

    if (!tool) {
      throw new AgentToolNotFoundError(name)
    }

    return tool
  }

  /**
   * Returns all currently registered tools.
   *
   * @returns A snapshot of the registered tools.
   */
  values(): readonly RegisteredAgentTool<Context>[] {
    return Array.from(this.tools.values())
  }

  // MARK: - Private methods

  private erase<Input, Output>(tool: AgentTool<Input, Output, Context>): RegisteredAgentTool<Context> {
    return {
      description: tool.description,
      inputSchema: tool.inputSchema as ZodType<unknown>,
      metadata: tool.metadata,
      name: tool.name,
      outputSchema: tool.outputSchema,
      execute: async (input: unknown, context: Context): Promise<unknown> => tool.execute(input as Input, context),
    }
  }
}
