// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import {
  AgentRuntime,
  type AgentRuntimeRequest,
} from '@cortex/agent-runtime'
import { ContentKind, LLMMessageRole, type LLMMessage } from '@cortex/llm'
import type { ExecutionEngine } from './execution-engine'
import type { ExecutionEngineRequest, ExecutionEngineResult } from './models'

/**
 * {@link ExecutionEngine} backed by Cortex {@link AgentRuntime}.
 *
 * Used for agent-owned processes that run through the Kernel / LLM stack
 * rather than an external workspace SDK. The composed prompt is sent as the
 * user turn; the agent's packaged system prompt is applied by the runtime.
 */
@Injectable()
export class AgentRuntimeExecutionEngine implements ExecutionEngine {
  // MARK: - Constructor

  /**
   * Creates an AgentRuntime-backed execution engine.
   *
   * @param agentRuntime - Runtime used to execute registered agents.
   */
  constructor(private readonly agentRuntime: AgentRuntime) {}

  async run(request: ExecutionEngineRequest): Promise<ExecutionEngineResult> {
    request.signal.throwIfAborted()

    if (!request.agentId) {
      throw new Error('agentId is required to run the AgentRuntime execution engine.')
    }

    const messages: readonly LLMMessage[] = [
      {
        role: LLMMessageRole.User,
        content: [
          {
            text: request.prompt,
            type: ContentKind.Text,
          },
        ],
      },
    ]

    const runtimeRequest: AgentRuntimeRequest = {
      agentId: request.agentId,
      messages,
      toolNames: [],
    }

    const result = await this.agentRuntime.execute(runtimeRequest, {
      executionId: `execution-engine:${request.agentId}`,
      signal: request.signal,
    })

    request.signal.throwIfAborted()

    const output = result.finalTurn.content
      .filter((content) => content.type === ContentKind.Text)
      .map((content) => content.text)
      .join('')

    return {
      output,
    }
  }
}
