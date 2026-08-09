// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  AgentDefinition,
  AgentDefinitionRegistry,
  AgentFactory,
  AgentRole,
  AgentRuntime,
  AgentToolExecutor,
  AgentToolRegistry,
  DefaultAgentExecutionScopeResolver,
  Kernel,
  type AgentExecutionContext,
  type AgentLLMDefinition,
  type AgentLLMResolver,
  type AgentTool,
} from '@cortex/agent-runtime'
import {
  ContentKind,
  LLMMessageRole,
  LLMProviderType,
  LLMStopReason,
  type LLM,
  type LLMRequest,
  type LLMResponse,
} from '@cortex/llm'
import { AgentExecuteJobKind } from '@cortex/protocol'
import { z } from 'zod'
import { AgentExecuteJobHandler } from '../../../src/handlers'
import type { NodeConfiguration } from '../../../src/configuration'
import { ExecutionJobHandlerRegistry } from '../../../src/execution/handler'
import { CortexExecutionJobResource } from '../../../src/cortex'
import { ExecutionJobPoller } from '../../../src/execution/jobs/polling'
import {
  ExecutionJobProcessor,
  type ClaimedExecutionJob,
} from '../../../src/execution/jobs/processing'

interface TestAddInput {
  readonly left: number
  readonly right: number
}

interface TestAddOutput {
  readonly value: number
}

/**
 * Returns predefined LLM responses in order while recording every request.
 */
class ScriptedLLM implements LLM {
  // MARK: - Properties

  readonly requests: LLMRequest[] = []

  // MARK: - Private Properties

  private responseIndex = 0

  // MARK: - Constructor

  constructor(private readonly responses: readonly LLMResponse[]) {}

  // MARK: - LLM

  async complete(request: LLMRequest): Promise<LLMResponse> {
    request.signal?.throwIfAborted()

    // Snapshot mutable conversation state — the agent reuses the messages array across turns.
    this.requests.push({
      ...request,
      messages: structuredClone(request.messages),
      tools: request.tools?.map((tool) => ({ ...tool })),
    })

    const response = this.responses[this.responseIndex]

    if (!response) {
      throw new Error(`No scripted LLM response exists for request ${this.responseIndex + 1}.`)
    }

    this.responseIndex += 1

    return response
  }
}

/**
 * Resolves a predefined LLM for every agent definition.
 */
class StaticAgentLLMResolver implements AgentLLMResolver {
  // MARK: - Constructor

  constructor(private readonly llm: LLM) {}

  // MARK: - AgentLLMResolver

  resolve(_definition: AgentLLMDefinition): Promise<LLM> {
    return Promise.resolve(this.llm)
  }
}

/**
 * Adds two numeric values.
 */
class TestAddTool implements AgentTool<TestAddInput, TestAddOutput> {
  // MARK: - Properties

  readonly description = 'Adds two numeric values.'

  readonly inputSchema = z.object({
    left: z.number(),
    right: z.number(),
  })

  readonly name = 'test.add'

  readonly execute = jest.fn(
    async (input: TestAddInput, _context: AgentExecutionContext): Promise<TestAddOutput> => {
      return {
        value: input.left + input.right,
      }
    },
  )
}

/**
 * Creates the Node configuration needed by the poller.
 */
function makeConfiguration(): NodeConfiguration {
  return {
    pollingIntervalMilliseconds: 1_000,
  } as NodeConfiguration
}

/**
 * Creates the registered agent definition used by the integration test.
 */
function makeAgentDefinition(): AgentDefinition {
  return new AgentDefinition(
    'assistant',
    {
      capabilities: [],
      delegatesTo: [],
      description: 'General-purpose Cortex assistant.',
      name: 'Assistant',
      role: AgentRole.Main,
      skills: [],
      systemPrompt: 'Complete the user request using the available tools.',
    },
    {
      maximumOutputTokens: 300,
      model: 'test-model',
      provider: LLMProviderType.OpenAI,
      temperature: 0,
    },
    {
      maximumIterations: 4,
      timeoutMilliseconds: 5_000,
    },
    {
      allowCapabilityUse: false,
      allowDelegation: false,
      allowSkillUse: false,
      maximumDelegationDepth: 0,
    },
  )
}

/**
 * Creates the claimed agent execution job.
 */
function makeClaimedJob(): ClaimedExecutionJob {
  return {
    claimToken: '22222222-2222-4222-8222-222222222222',
    id: 'execution-job-1',
    kind: AgentExecuteJobKind,
    payload: {
      agentId: 'assistant',
      input: 'Add two and three.',
      toolNames: ['test.add'],
    },
  } as ClaimedExecutionJob
}

/**
 * Creates the first scripted turn, which requests tool execution.
 */
function makeToolUseResponse(): LLMResponse {
  return {
    content: [
      {
        id: 'tool-use-1',
        input: {
          left: 2,
          right: 3,
        },
        name: 'test.add',
        type: ContentKind.ToolUse,
      },
    ],
    model: 'test-model',
    stopReason: LLMStopReason.ToolUse,
    usage: {
      inputTokens: 10,
      outputTokens: 3,
    },
  }
}

/**
 * Creates the final scripted assistant response.
 */
function makeCompletedResponse(): LLMResponse {
  return {
    content: [
      {
        text: 'The result is 5.',
        type: ContentKind.Text,
      },
    ],
    model: 'test-model',
    stopReason: LLMStopReason.Completed,
    usage: {
      inputTokens: 15,
      outputTokens: 5,
    },
  }
}

/**
 * Creates a real agent runtime backed by a scripted LLM.
 */
function makeRuntime(llm: LLM, tool: TestAddTool): AgentRuntime {
  const definitionRegistry = new AgentDefinitionRegistry()

  definitionRegistry.register(makeAgentDefinition())

  const toolRegistry = new AgentToolRegistry()

  toolRegistry.register(tool)

  const toolExecutor = new AgentToolExecutor(toolRegistry)
  const kernel = new Kernel(toolExecutor)
  const agentFactory = new AgentFactory(new StaticAgentLLMResolver(llm))

  return new AgentRuntime(
    agentFactory,
    definitionRegistry,
    new DefaultAgentExecutionScopeResolver(),
    kernel,
    toolRegistry,
  )
}

/**
 * Creates an execution-job client double.
 */
function makeCortexExecutionJobResource(
  job: ClaimedExecutionJob,
  controller: AbortController,
): {
  readonly claimNextAvailable: jest.Mock
  readonly complete: jest.Mock
  readonly fail: jest.Mock
  readonly client: CortexExecutionJobResource
} {
  const claimNextAvailable = jest.fn()
  const complete = jest.fn()
  const fail = jest.fn()

  claimNextAvailable.mockResolvedValue({
    job,
  })

  complete.mockImplementation(async () => {
    controller.abort()
  })

  return {
    claimNextAvailable,
    complete,
    fail,
    client: {
      claimNextAvailable,
      complete,
      fail,
    } as unknown as CortexExecutionJobResource,
  }
}

describe('agent.execute job flow', () => {
  it('executes an agent tool and completes the job with the final result', async () => {
    const controller = new AbortController()
    const tool = new TestAddTool()

    const llm = new ScriptedLLM([makeToolUseResponse(), makeCompletedResponse()])
    const runtime = makeRuntime(llm, tool)
    const registry = new ExecutionJobHandlerRegistry([new AgentExecuteJobHandler(runtime)])
    const processor = new ExecutionJobProcessor(registry)
    const job = makeClaimedJob()

    const { claimNextAvailable, complete, fail, client } = makeCortexExecutionJobResource(job, controller)

    const poller = new ExecutionJobPoller(makeConfiguration(), client, processor)

    await poller.run('node-1', controller.signal)

    expect(claimNextAvailable).toHaveBeenCalledTimes(1)
    expect(claimNextAvailable).toHaveBeenCalledWith('node-1', controller.signal)

    expect(tool.execute).toHaveBeenCalledTimes(1)
    expect(tool.execute).toHaveBeenCalledWith(
      {
        left: 2,
        right: 3,
      },
      expect.objectContaining({
        executionId: 'execution-job-1',
      }),
    )

    expect(llm.requests).toHaveLength(2)

    expect(llm.requests[0]?.messages).toEqual([
      {
        content: [
          {
            text: 'Add two and three.',
            type: ContentKind.Text,
          },
        ],
        role: LLMMessageRole.User,
      },
    ])

    expect(llm.requests[0]?.tools).toEqual([
      expect.objectContaining({
        name: 'test.add',
      }),
    ])

    expect(llm.requests[1]?.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              toolUseId: 'tool-use-1',
              type: ContentKind.ToolResult,
            }),
          ]),
          role: LLMMessageRole.Tool,
        }),
      ]),
    )

    expect(complete).toHaveBeenCalledTimes(1)

    const completeCall = complete.mock.calls[0]

    expect(completeCall?.[0]).toBe('execution-job-1')
    expect(completeCall?.[1]).toEqual({
      claimToken: '22222222-2222-4222-8222-222222222222',
      nodeId: 'node-1',
      result: {
        executionId: 'execution-job-1',
        iterationCount: 2,
        output: 'The result is 5.',
        usage: {
          inputTokens: 25,
          outputTokens: 8,
          totalTokens: 33,
        },
      },
    })
    expect(Object.is(completeCall?.[2], controller.signal)).toBe(true)

    expect(fail).not.toHaveBeenCalled()
  })
})
