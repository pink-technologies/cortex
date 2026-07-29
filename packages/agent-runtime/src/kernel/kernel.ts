// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentExecutionContext } from '../execution/agent-execution-context'
import type { AgentToolExecutor } from '../tool'
import type { KernelRequest, KernelResult } from './models'
import {
  ContentKind,
  LLMMessageRole,
  LLMStopReason,
  type LLMMessage,
  type TokenUsage,
  type ToolResultContent,
  type ToolUseContent,
} from '@cortex/llm'

import {
  KernelEmptyResponseError,
  KernelMaximumIterationsError,
  KernelTimeoutError,
  KernelToolNotAllowedError,
  KernelUnexpectedStopReasonError,
} from './error/kernel.error'

/**
 * Coordinates the multi-turn execution loop for a single agent run.
 *
 * The kernel is the runtime orchestrator between an {@link Agent}, the
 * language-model conversation, and {@link AgentToolExecutor}. It does not
 * produce model completions itself; it drives {@link Agent.nextTurn}, enforces
 * allowlists and execution limits from {@link AgentDefinition.execution}, and
 * feeds tool results back into the conversation until the agent completes.
 *
 * Loop responsibilities:
 * - keep a mutable conversation snapshot (callers' `messages` are not mutated)
 * - append assistant turns and tool-result messages in order
 * - execute requested tools sequentially when the stop reason is tool use
 * - accumulate {@link TokenUsage} across every agent turn
 * - enforce `maximumIterations` and `timeoutMilliseconds`
 * - honor caller cancellation via {@link AgentExecutionContext.signal}
 *
 * Successful runs end with {@link LLMStopReason.Completed} and non-empty
 * content. Unexpected stop reasons, empty completions, unauthorized tools, and
 * budget exhaustion surface as {@link KernelError} subclasses.
 */
export class Kernel {
  // MARK: - Private Properties

  /**
   * Validates and executes tool requests produced by the agent.
   */
  private readonly toolExecutor: AgentToolExecutor

  // MARK: - Constructor

  /**
   * Creates a kernel.
   *
   * @param toolExecutor - Executor used to resolve, validate, and run tool
   *   requests exposed on {@link KernelRequest.tools}.
   */
  constructor(toolExecutor: AgentToolExecutor) {
    this.toolExecutor = toolExecutor
  }

  // MARK: - Instance Methods

  /**
   * Executes an agent request until a final response is produced.
   *
   * Creates a child abort controller that merges:
   * - the caller-provided {@link AgentExecutionContext.signal}
   * - a timeout derived from
   *   {@link AgentDefinition.execution.timeoutMilliseconds}
   *
   * The iterative loop then runs under that combined signal. Timeout aborts
   * use {@link KernelTimeoutError} as the abort reason.
   *
   * Conversation flow per iteration:
   * 1. Call {@link Agent.nextTurn} with the current conversation and tools.
   * 2. Append the assistant turn to the conversation.
   * 3. If the turn contains tool requests, validate stop reason and allowlist,
   *    execute tools, append tool results, and continue.
   * 4. Otherwise require {@link LLMStopReason.Completed} and non-empty content,
   *    then return {@link KernelResult}.
   *
   * @param request - Agent, initial conversation, and tools for this run.
   * @param context - Execution id and cancellation signal from the caller.
   * @returns The completed conversation, final turn, iteration count, and usage.
   * @throws {@link KernelEmptyResponseError} when a completed turn contains no
   *   content.
   * @throws {@link KernelMaximumIterationsError} when another agent turn would
   *   exceed {@link AgentDefinition.execution.maximumIterations}, or when the
   *   loop ends without a completed final turn.
   * @throws {@link KernelTimeoutError} when execution exceeds
   *   {@link AgentDefinition.execution.timeoutMilliseconds}.
   * @throws {@link KernelToolNotAllowedError} when the agent requests a tool
   *   name that is not present in {@link KernelRequest.tools}.
   * @throws {@link KernelUnexpectedStopReasonError} when tool-use content and
   *   stop reason disagree, or when the stop reason is not completed after a
   *   non-tool turn.
   */
  async execute(request: KernelRequest, context: AgentExecutionContext): Promise<KernelResult> {
    context.signal.throwIfAborted()

    const abortController = new AbortController()

    const handleCancellation = (): void => {
      abortController.abort(context.signal.reason)
    }

    context.signal.addEventListener('abort', handleCancellation, {
      once: true,
    })

    if (context.signal.aborted) {
      handleCancellation()
    }

    const timeoutMilliseconds = request.agent.definition.execution.timeoutMilliseconds
    const timeout = setTimeout(() => {
      abortController.abort(new KernelTimeoutError(timeoutMilliseconds))
    }, timeoutMilliseconds)

    const executionContext: AgentExecutionContext = {
      executionId: context.executionId,
      signal: abortController.signal,
    }

    try {
      return await this.executeRequest(request, executionContext)
    } catch (error) {
      if (context.signal.aborted) {
        context.signal.throwIfAborted()
      }

      if (abortController.signal.reason instanceof KernelTimeoutError) {
        throw abortController.signal.reason
      }

      throw error
    } finally {
      clearTimeout(timeout)

      context.signal.removeEventListener('abort', handleCancellation)
    }
  }

  // MARK: - Private Methods

  private async executeRequest(request: KernelRequest, context: AgentExecutionContext): Promise<KernelResult> {
    const conversation: LLMMessage[] = [...request.messages]
    const allowedToolNames = new Set(request.tools.map((tool) => tool.name))
    const maximumIterations = request.agent.definition.execution.maximumIterations

    let usage: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
    }

    for (let iteration = 1; iteration <= maximumIterations; iteration += 1) {
      context.signal.throwIfAborted()

      const turn = await request.agent.nextTurn(
        {
          messages: conversation,
          tools: request.tools,
        },
        context,
      )

      usage = {
        inputTokens: usage.inputTokens + turn.usage.inputTokens,
        outputTokens: usage.outputTokens + turn.usage.outputTokens,
      }

      conversation.push({
        content: turn.content,
        role: LLMMessageRole.Assistant,
      })

      const toolUses = turn.content.filter((item): item is ToolUseContent => item.type === ContentKind.ToolUse)

      if (toolUses.length > 0) {
        if (turn.stopReason !== LLMStopReason.ToolUse) {
          throw new KernelUnexpectedStopReasonError(
            turn.stopReason,
            'The agent returned tool requests without a tool-use stop reason.',
          )
        }

        if (iteration === maximumIterations) {
          throw new KernelMaximumIterationsError(maximumIterations)
        }

        const toolResults = await this.executeTools(toolUses, allowedToolNames, context)

        conversation.push({
          content: toolResults,
          role: LLMMessageRole.Tool,
        })

        continue
      }

      if (turn.stopReason === LLMStopReason.ToolUse) {
        throw new KernelUnexpectedStopReasonError(
          turn.stopReason,
          'The agent stopped for tool use without returning a tool request.',
        )
      }

      if (turn.stopReason !== LLMStopReason.Completed) {
        throw new KernelUnexpectedStopReasonError(turn.stopReason, 'The agent did not complete the execution.')
      }

      if (turn.content.length === 0) {
        throw new KernelEmptyResponseError()
      }

      return {
        conversation: [...conversation],
        executionId: context.executionId,
        finalTurn: turn,
        iterationCount: iteration,
        usage,
      }
    }

    throw new KernelMaximumIterationsError(maximumIterations)
  }

  private async executeTools(
    toolUses: readonly ToolUseContent[],
    allowedToolNames: ReadonlySet<string>,
    context: AgentExecutionContext,
  ): Promise<ToolResultContent[]> {
    const results: ToolResultContent[] = []

    for (const toolUse of toolUses) {
      context.signal.throwIfAborted()

      if (!allowedToolNames.has(toolUse.name)) {
        throw new KernelToolNotAllowedError(toolUse.name, toolUse.id)
      }

      const result = await this.toolExecutor.execute(toolUse, context)
      const content = typeof result.output === 'string' ? result.output : (JSON.stringify(result.output) ?? 'null')

      results.push({
        content: content,
        toolUseId: result.toolUseId,
        type: ContentKind.ToolResult,
      })
    }

    return results
  }
}
