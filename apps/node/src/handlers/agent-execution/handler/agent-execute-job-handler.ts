// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentRuntime, type AgentRuntimeRequest } from '@cortex/agent-runtime'
import { ContentKind, type LLMMessage, LLMMessageRole } from '@cortex/llm'
import { Injectable } from '@nestjs/common'
import { type ExecutionJobHandler, type ExecutionJobHandlerContext } from '../../../execution/handler'
import {
  AgentExecuteJobKind,
  AgentExecuteJobPayloadSchema,
  AgentExecuteJobResultSchema,  
  type AgentExecuteJobResult,
} from '@cortex/protocol'

/**
 * Executes claimed jobs with kind {@link AgentExecuteJobKind}.
 *
 * This is the Node capability handler for `agent.execute`: it maps the
 * protocol payload onto {@link AgentRuntime}, honors cancellation through
 * {@link ExecutionJobHandlerContext.signal}, and returns a validated
 * {@link AgentExecuteJobResult} for completion reporting.
 *
 * Responsibilities:
 * - run the requested agent with the job input and tool allowlist
 * - forward the execution id and abort signal into the runtime context
 * - map the kernel result into the protocol completion shape
 *
 * Non-responsibilities:
 * - claiming jobs or resolving handlers by kind
 * - marking jobs completed or failed on the Cortex API
 */
@Injectable()
export class AgentExecuteJobHandler implements ExecutionJobHandler<AgentExecuteJobResult> {
  // MARK: - Properties

  /**
   * Job-kind discriminator this handler supports.
   */
  readonly kind = AgentExecuteJobKind

  // MARK: - Constructor

  /**
   * Creates an `agent.execute` job handler.
   *
   * @param agentRuntime - Runtime used to execute registered agents.
   */
  constructor(private readonly agentRuntime: AgentRuntime) {}

  // MARK: - Instance methods

  /**
   * Runs an agent against the claimed job payload.
   *
   * @param payload - Validated `agent.execute` payload from the claimed job.
   * @param context - Execution identity and cancellation controls.
   * @returns Protocol result suitable for job completion reporting.
   * @throws {DOMException} When the provided signal is aborted.
   */
  async process(payload: unknown, context: ExecutionJobHandlerContext): Promise<AgentExecuteJobResult> {
    context.signal.throwIfAborted()

    const jobPayload = AgentExecuteJobPayloadSchema.parse(payload)
    const messages: readonly LLMMessage[] = [
      {
        role: LLMMessageRole.User,
        content: [
          {
            text: jobPayload.input,
            type: ContentKind.Text,
          },
        ],
      },
    ]

    const request: AgentRuntimeRequest = {
      agentId: jobPayload.agentId,
      messages,
      toolNames: jobPayload.toolNames,
    }

    const result = await this.agentRuntime.execute(request, {
      executionId: context.executionId,
      signal: context.signal,
    })

    context.signal.throwIfAborted()

    const output = result.finalTurn.content
      .filter((content) => {
        return content.type === ContentKind.Text
      })
      .map((content) => {
        return content.text
      })
      .join('')

    return AgentExecuteJobResultSchema.parse({
      executionId: result.executionId,
      iterationCount: result.iterationCount,
      output,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.inputTokens + result.usage.outputTokens,
      },
    })
  }
}
