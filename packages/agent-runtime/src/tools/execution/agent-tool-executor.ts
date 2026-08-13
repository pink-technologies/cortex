// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ToolUseContent } from '@cortex/llm'
import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import type { AgentToolRegistry } from '@/tools/registry/agent-tool-registry'
import type { AgentToolExecutionResult } from './agent-tool-execution-result'
import type { AgentToolAuthorizationPolicy } from '../authorization'
import {
  AgentToolExecutionError,
  AgentToolInputValidationError,
  AgentToolOutputValidationError,
  AgentToolPermissionDeniedError,
} from '@/tools/error/error'

/**
 * Resolves, authorizes, validates, and executes tools requested by an agent.
 *
 * The executor verifies that the execution context grants every permission
 * required by the tool before validating its input. Tool input is validated
 * before execution and tool output is validated before returning it to the
 * agent runtime.
 *
 * @typeParam Context - Runtime context supported by the tool registry.
 */
export class AgentToolExecutor<Context extends AgentExecutionContext = AgentExecutionContext> {
  // MARK: - Private Properties

  private readonly policy: AgentToolAuthorizationPolicy<Context>
  private readonly registry: AgentToolRegistry<Context>

  // MARK: - Constructor

  /**
   * Creates an agent tool executor.
   *
   * @param registry - Registry used to resolve requested tools.
   * @param policy - Policy used to authorize tool execution for the current
   *   context.
   */
  constructor(registry: AgentToolRegistry<Context>, policy: AgentToolAuthorizationPolicy) {
    this.policy = policy
    this.registry = registry
  }

  // MARK: - Instance methods

  /**
   * Executes the specified tool request.
   *
   * The tool is resolved by name and its required permissions are verified before
   * its input is validated. Output is validated after execution. Cancellation is
   * checked before and after invoking the tool and before returning the result.
   *
   * @param toolUse - Tool request produced by the language model.
   * @param context - Runtime information associated with the execution.
   * @returns The correlated tool execution result.
   * @throws {@link AgentToolNotFoundError} when the tool is not registered.
   * @throws {@link AgentToolPermissionDeniedError} when the execution context
   * does not grant every permission required by the tool.
   * @throws {@link AgentToolInputValidationError} when the input is invalid.
   * @throws {@link AgentToolOutputValidationError} when the output is invalid.
   * @throws {@link AgentToolExecutionError} when the tool fails.
   */
  async execute(toolUse: ToolUseContent, context: Context): Promise<AgentToolExecutionResult> {
    context.signal.throwIfAborted()

    const tool = this.registry.resolve(toolUse.name)
    const isAllowed = await this.policy.allows(tool.metadata, context)

    context.signal.throwIfAborted()

    if (!isAllowed) {
      const permissions = tool.metadata.permissions
      const missingPermissions = permissions.filter((permission) => {
        return !context.permissions.has(permission)
      })

      throw new AgentToolPermissionDeniedError(toolUse.name, toolUse.id, missingPermissions)
    }

    const inputValidationResult = await tool.inputSchema.safeParseAsync(toolUse.input)

    if (!inputValidationResult.success) {
      throw new AgentToolInputValidationError(tool.name, toolUse.id, inputValidationResult.error)
    }

    let output: unknown

    try {
      output = await tool.execute(inputValidationResult.data, context)

      context.signal.throwIfAborted()
    } catch (error) {
      if (context.signal.aborted) {
        context.signal.throwIfAborted()
      }

      throw new AgentToolExecutionError(tool.name, toolUse.id, error)
    }

    const outputValidationResult = await tool.outputSchema.safeParseAsync(output)

    if (!outputValidationResult.success) {
      throw new AgentToolOutputValidationError(tool.name, toolUse.id, outputValidationResult.error)
    }

    context.signal.throwIfAborted()

    return {
      output: outputValidationResult.data,
      toolName: tool.name,
      toolUseId: toolUse.id,
    }
  }
}
