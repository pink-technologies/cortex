// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ToolUseContent } from '@cortex/llm'
import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import { AgentToolExecutionError, AgentToolInputValidationError } from '@/tool/error/error'
import type { AgentToolRegistry } from '@/tool/registry/agent-tool-registry'
import type { AgentToolExecutionResult } from './agent-tool-execution-result'

/**
 * Resolves, validates, and executes tools requested by an agent.
 *
 * The executor treats tool input as untrusted until it has been successfully
 * validated by the registered tool's input schema.
 *
 * @typeParam Context - Runtime context supported by the tool registry.
 */
export class AgentToolExecutor<Context extends AgentExecutionContext = AgentExecutionContext> {
  // MARK: - Private Properties

  private readonly registry: AgentToolRegistry<Context>

  // MARK: - Constructor

  /**
   * Creates an agent tool executor.
   *
   * @param registry - Registry used to resolve requested tools.
   */
  constructor(registry: AgentToolRegistry<Context>) {
    this.registry = registry
  }

  // MARK: - Instance Methods

  /**
   * Executes the specified tool request.
   *
   * The tool is resolved by name and its input is validated before execution.
   * Cancellation is checked before and after invoking the tool.
   *
   * @param toolUse - Tool request produced by the language model.
   * @param context - Runtime information associated with the execution.
   * @returns The correlated tool execution result.
   * @throws {@link AgentToolNotFoundError} when the tool is not registered.
   * @throws {@link AgentToolInputValidationError} when the input is invalid.
   * @throws {@link AgentToolExecutionError} when the tool fails.
   */
  async execute(toolUse: ToolUseContent, context: Context): Promise<AgentToolExecutionResult> {
    context.signal.throwIfAborted()

    const tool = this.registry.resolve(toolUse.name)
    const validationResult = await tool.inputSchema.safeParseAsync(toolUse.input)

    if (!validationResult.success) {
      throw new AgentToolInputValidationError(tool.name, toolUse.id, validationResult.error)
    }

    try {
      const output = await tool.execute(validationResult.data, context)

      context.signal.throwIfAborted()

      return {
        output,
        toolName: tool.name,
        toolUseId: toolUse.id,
      }
    } catch (error) {
      if (context.signal.aborted) {
        context.signal.throwIfAborted()
      }

      throw new AgentToolExecutionError(tool.name, toolUse.id, error)
    }
  }
}
