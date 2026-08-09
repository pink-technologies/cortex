// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  ContentKind,
  LLMMessageRole,
  LLMStopReason,
  type LLMMessage,
  type LLMResponse,
  type LLMToolDefinition,
  type TokenUsage,
} from '@cortex/llm'
import { z } from 'zod'
import { LlmAgent } from '../../src/agent'
import {
  KernelEmptyResponseError,
  KernelMaximumIterationsError,
  KernelTimeoutError,
  KernelToolNotAllowedError,
  KernelUnexpectedStopReasonError,
} from '../../src/kernel/error/error'
import { Kernel } from '../../src/kernel/kernel'
import {
  AgentToolExecutor,
  AgentToolInputValidationError,
  AgentToolRegistry,
  type AgentTool,
} from '../../src/tool'
import { createAgentDefinitionFixture } from '../fixtures/agent'
import { createAgentExecutionContextFixture } from '../fixtures/execution'
import { ScriptedLLM } from '../fixtures/llm'
import { createTestAddTool } from '../fixtures/tool'

describe('Kernel', () => {
  describe('Given a completed assistant turn without tools', () => {
    describe('When the kernel executes the request', () => {
      it('Then completes without tools', async () => {
        const scriptedLLM = new ScriptedLLM([createCompletedResponse('Hello.')])
        const { kernel, agent } = createKernelHarness({ scriptedLLM })

        const result = await kernel.execute(
          {
            agent,
            messages: [createUserMessage('Hi.')],
            tools: [],
          },
          createAgentExecutionContextFixture(),
        )

        expect(result.iterationCount).toBe(1)
        expect(result.finalTurn).toEqual(createCompletedResponse('Hello.'))
        expect(result.conversation).toHaveLength(2)
        expect(scriptedLLM.requests).toHaveLength(1)
      })
    })
  })

  describe('Given an initial user message that requires test.add', () => {
    describe('When the scripted LLM requests the tool and then returns a final answer', () => {
      it('Then executes test.add and completes on the second turn', async () => {
        const scriptedLLM = new ScriptedLLM([
          createToolUseResponse('tool-use-1', 'test.add', { left: 2, right: 3 }, { inputTokens: 20, outputTokens: 7 }),
          createCompletedResponse('The result is 5.', { inputTokens: 10, outputTokens: 4 }),
        ])

        const addTool = createTestAddTool()
        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [addTool],
        })

        const result = await kernel.execute(
          {
            agent,
            messages: [createUserMessage('Add 2 and 3.')],
            tools,
          },
          createAgentExecutionContextFixture(),
        )

        expect(result.iterationCount).toBe(2)
        expect(result.executionId).toBe('execution-1')
        expect(result.usage).toEqual({
          inputTokens: 30,
          outputTokens: 11,
        })
        expect(scriptedLLM.requests).toHaveLength(2)

        expect(result.conversation).toEqual([
          {
            content: [
              {
                text: 'Add 2 and 3.',
                type: ContentKind.Text,
              },
            ],
            role: LLMMessageRole.User,
          },
          {
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
            role: LLMMessageRole.Assistant,
          },
          {
            content: [
              {
                content: '{"value":5}',
                toolUseId: 'tool-use-1',
                type: ContentKind.ToolResult,
              },
            ],
            role: LLMMessageRole.Tool,
          },
          {
            content: [
              {
                text: 'The result is 5.',
                type: ContentKind.Text,
              },
            ],
            role: LLMMessageRole.Assistant,
          },
        ])
      })

      it('Then appends the tool result with the correct toolUseId', async () => {
        const toolUseId = 'tool-use-42'
        const scriptedLLM = new ScriptedLLM([
          createToolUseResponse(toolUseId, 'test.add', { left: 1, right: 1 }),
          createCompletedResponse('Done.'),
        ])

        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [createTestAddTool()],
        })

        const result = await kernel.execute(
          {
            agent,
            messages: [createUserMessage('Add 1 and 1.')],
            tools,
          },
          createAgentExecutionContextFixture(),
        )

        const toolMessage = result.conversation[2]
        expect(toolMessage?.role).toBe(LLMMessageRole.Tool)
        expect(toolMessage?.content).toEqual([
          {
            content: '{"value":2}',
            toolUseId,
            type: ContentKind.ToolResult,
          },
        ])
      })

      it('Then serializes object tool output', async () => {
        const scriptedLLM = new ScriptedLLM([
          createToolUseResponse('tool-use-1', 'test.add', { left: 2, right: 3 }),
          createCompletedResponse('The result is 5.'),
        ])

        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [createTestAddTool()],
        })

        const result = await kernel.execute(
          {
            agent,
            messages: [createUserMessage('Add 2 and 3.')],
            tools,
          },
          createAgentExecutionContextFixture(),
        )

        expect(result.conversation[2]?.content[0]).toMatchObject({
          content: '{"value":5}',
          type: ContentKind.ToolResult,
        })
      })

      it('Then preserves string tool output', async () => {
        const scriptedLLM = new ScriptedLLM([
          createToolUseResponse('tool-use-1', 'test.add', { left: 2, right: 3 }),
          createCompletedResponse('The result is 5.'),
        ])

        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [createTestAddTool({ asString: true })],
        })

        const result = await kernel.execute(
          {
            agent,
            messages: [createUserMessage('Add 2 and 3.')],
            tools,
          },
          createAgentExecutionContextFixture(),
        )

        expect(result.conversation[2]?.content[0]).toMatchObject({
          content: '5',
          type: ContentKind.ToolResult,
        })
      })

      it('Then accumulates token usage', async () => {
        const scriptedLLM = new ScriptedLLM([
          createToolUseResponse('tool-use-1', 'test.add', { left: 2, right: 3 }, { inputTokens: 20, outputTokens: 7 }),
          createCompletedResponse('The result is 5.', { inputTokens: 10, outputTokens: 4 }),
        ])

        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [createTestAddTool()],
        })

        const result = await kernel.execute(
          {
            agent,
            messages: [createUserMessage('Add 2 and 3.')],
            tools,
          },
          createAgentExecutionContextFixture(),
        )

        expect(result.usage).toEqual({
          inputTokens: 30,
          outputTokens: 11,
        })
      })
    })
  })

  describe('Given a tool request that is not exposed on the kernel request', () => {
    describe('When the kernel executes the request', () => {
      it('Then rejects unauthorized tools', async () => {
        const scriptedLLM = new ScriptedLLM([
          createToolUseResponse('tool-use-1', 'test.add', { left: 2, right: 3 }),
        ])

        const addTool = createTestAddTool()
        const registry = new AgentToolRegistry()
        registry.register(addTool)

        const kernel = new Kernel(new AgentToolExecutor(registry))
        const agent = new LlmAgent(createAgentDefinitionFixture(), scriptedLLM)

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Add 2 and 3.')],
              tools: [],
            },
            createAgentExecutionContextFixture(),
          ),
        ).rejects.toBeInstanceOf(KernelToolNotAllowedError)
      })
    })
  })

  describe('Given a tool request with invalid input', () => {
    describe('When the kernel executes the request', () => {
      it('Then rejects invalid tool input', async () => {
        const scriptedLLM = new ScriptedLLM([
          createToolUseResponse('tool-use-1', 'test.add', { left: 'two', right: 3 }),
        ])

        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [createTestAddTool()],
        })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Add two and 3.')],
              tools,
            },
            createAgentExecutionContextFixture(),
          ),
        ).rejects.toBeInstanceOf(AgentToolInputValidationError)
      })
    })
  })

  describe('Given inconsistent stop reasons', () => {
    describe('When tool content is returned without a tool-use stop reason', () => {
      it('Then rejects inconsistent stop reasons', async () => {
        const scriptedLLM = new ScriptedLLM([
          {
            ...createToolUseResponse('tool-use-1', 'test.add', { left: 2, right: 3 }),
            stopReason: LLMStopReason.Completed,
          },
        ])

        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [createTestAddTool()],
        })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Add 2 and 3.')],
              tools,
            },
            createAgentExecutionContextFixture(),
          ),
        ).rejects.toBeInstanceOf(KernelUnexpectedStopReasonError)
      })
    })

    describe('When a tool-use stop reason is returned without tool content', () => {
      it('Then rejects inconsistent stop reasons', async () => {
        const scriptedLLM = new ScriptedLLM([
          {
            content: [
              {
                text: 'Calling a tool.',
                type: ContentKind.Text,
              },
            ],
            model: 'test-model',
            stopReason: LLMStopReason.ToolUse,
            usage: {
              inputTokens: 1,
              outputTokens: 1,
            },
          },
        ])

        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [createTestAddTool()],
        })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Add 2 and 3.')],
              tools,
            },
            createAgentExecutionContextFixture(),
          ),
        ).rejects.toBeInstanceOf(KernelUnexpectedStopReasonError)
      })
    })
  })

  describe('Given an empty completed assistant turn', () => {
    describe('When the kernel executes the request', () => {
      it('Then rejects an empty completed response', async () => {
        const scriptedLLM = new ScriptedLLM([
          {
            content: [],
            model: 'test-model',
            stopReason: LLMStopReason.Completed,
            usage: {
              inputTokens: 1,
              outputTokens: 0,
            },
          },
        ])

        const { kernel, agent } = createKernelHarness({ scriptedLLM })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Hi.')],
              tools: [],
            },
            createAgentExecutionContextFixture(),
          ),
        ).rejects.toBeInstanceOf(KernelEmptyResponseError)
      })
    })
  })

  describe('Given a maximumIterations limit of 1', () => {
    describe('When the agent requests a tool on the first turn', () => {
      it('Then enforces maximumIterations', async () => {
        const scriptedLLM = new ScriptedLLM([
          createToolUseResponse('tool-use-1', 'test.add', { left: 2, right: 3 }),
        ])

        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [createTestAddTool()],
          maximumIterations: 1,
        })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Add 2 and 3.')],
              tools,
            },
            createAgentExecutionContextFixture(),
          ),
        ).rejects.toBeInstanceOf(KernelMaximumIterationsError)
      })
    })
  })

  describe('Given a maximumIterations limit of 0', () => {
    describe('When the kernel starts the execution loop', () => {
      it('Then enforces maximumIterations before the first turn', async () => {
        const scriptedLLM = new ScriptedLLM([createCompletedResponse('Hello.')])
        const { kernel, agent } = createKernelHarness({
          scriptedLLM,
          maximumIterations: 0,
        })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Hi.')],
              tools: [],
            },
            createAgentExecutionContextFixture(),
          ),
        ).rejects.toBeInstanceOf(KernelMaximumIterationsError)
      })
    })
  })

  describe('Given a non-completed stop reason without tool content', () => {
    describe('When the kernel executes the request', () => {
      it('Then rejects the unexpected stop reason', async () => {
        const scriptedLLM = new ScriptedLLM([
          {
            content: [
              {
                text: 'Filtered.',
                type: ContentKind.Text,
              },
            ],
            model: 'test-model',
            stopReason: LLMStopReason.ContentFiltered,
            usage: {
              inputTokens: 1,
              outputTokens: 1,
            },
          },
        ])

        const { kernel, agent } = createKernelHarness({ scriptedLLM })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Hi.')],
              tools: [],
            },
            createAgentExecutionContextFixture(),
          ),
        ).rejects.toBeInstanceOf(KernelUnexpectedStopReasonError)
      })
    })
  })

  describe('Given a tool that returns undefined', () => {
    describe('When the kernel serializes the tool result', () => {
      it('Then stores a null JSON payload', async () => {
        const tool: AgentTool<Record<string, never>, undefined> = {
          description: 'Returns undefined.',
          inputSchema: z.object({}),
          name: 'test.undefined',
          async execute(): Promise<undefined> {
            return undefined
          },
        }

        const scriptedLLM = new ScriptedLLM([
          createToolUseResponse('tool-use-1', 'test.undefined', {}),
          createCompletedResponse('Done.'),
        ])

        const { kernel, agent, tools } = createKernelHarness({
          scriptedLLM,
          tools: [tool],
        })

        const result = await kernel.execute(
          {
            agent,
            messages: [createUserMessage('Call the tool.')],
            tools,
          },
          createAgentExecutionContextFixture(),
        )

        expect(result.conversation[2]?.content[0]).toMatchObject({
          content: 'null',
          toolUseId: 'tool-use-1',
          type: ContentKind.ToolResult,
        })
      })
    })
  })

  describe('Given a short execution timeout', () => {
    describe('When the language model does not respond in time', () => {
      it('Then enforces timeout', async () => {
        const scriptedLLM = new ScriptedLLM([
          {
            ...createCompletedResponse('Too late.'),
            delayMilliseconds: 100,
          },
        ])

        const { kernel, agent } = createKernelHarness({
          scriptedLLM,
          timeoutMilliseconds: 20,
        })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Hi.')],
              tools: [],
            },
            createAgentExecutionContextFixture(),
          ),
        ).rejects.toBeInstanceOf(KernelTimeoutError)
      })
    })
  })

  describe('Given a caller abort signal', () => {
    describe('When the caller cancels during a delayed language-model call', () => {
      it('Then enforces caller cancellation', async () => {
        const abortController = new AbortController()
        const scriptedLLM = new ScriptedLLM([
          {
            ...createCompletedResponse('Too late.'),
            delayMilliseconds: 200,
          },
        ])

        const { kernel, agent } = createKernelHarness({ scriptedLLM })

        setTimeout(() => {
          abortController.abort()
        }, 20)

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Hi.')],
              tools: [],
            },
            createAgentExecutionContextFixture({
              signal: abortController.signal,
            }),
          ),
        ).rejects.toThrow()

        expect(abortController.signal.aborted).toBe(true)
      })
    })

    describe('When the caller signal is already aborted before execute begins', () => {
      it('Then rejects immediately', async () => {
        const abortController = new AbortController()
        abortController.abort()

        const scriptedLLM = new ScriptedLLM([createCompletedResponse('Hello.')])
        const { kernel, agent } = createKernelHarness({ scriptedLLM })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Hi.')],
              tools: [],
            },
            createAgentExecutionContextFixture({
              signal: abortController.signal,
            }),
          ),
        ).rejects.toThrow()
      })
    })

    describe('When the caller signal aborts after the initial check and before the listener is attached', () => {
      it('Then propagates the already-aborted signal into the child controller', async () => {
        let abortedReads = 0
        const reason = new Error('Aborted before listener.')
        const signal = {
          get aborted(): boolean {
            abortedReads += 1
            // First read: throwIfAborted sees false.
            // Later reads: treat as already aborted so handleCancellation runs.
            return abortedReads > 1
          },
          reason,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          throwIfAborted(): void {
            if (signal.aborted) {
              throw reason
            }
          },
        } as unknown as AbortSignal

        const scriptedLLM = new ScriptedLLM([createCompletedResponse('Hello.')])
        const { kernel, agent } = createKernelHarness({ scriptedLLM })

        await expect(
          kernel.execute(
            {
              agent,
              messages: [createUserMessage('Hi.')],
              tools: [],
            },
            {
              executionId: 'execution-1',
              signal,
            },
          ),
        ).rejects.toThrow('Aborted before listener.')
      })
    })
  })
})

function createKernelHarness(options: {
  readonly scriptedLLM: ScriptedLLM
  readonly tools?: readonly AgentTool<unknown, unknown>[]
  readonly maximumIterations?: number
  readonly timeoutMilliseconds?: number
}): {
  readonly agent: LlmAgent
  readonly kernel: Kernel
  readonly tools: LLMToolDefinition[]
} {
  const registry = new AgentToolRegistry()
  const registeredTools = options.tools ?? []

  for (const tool of registeredTools) {
    registry.register(tool)
  }

  const kernel = new Kernel(new AgentToolExecutor(registry))
  const agent = new LlmAgent(
    createAgentDefinitionFixture({
      maximumIterations: options.maximumIterations,
      timeoutMilliseconds: options.timeoutMilliseconds,
    }),
    options.scriptedLLM,
  )

  return {
    agent,
    kernel,
    tools: registeredTools.map((tool) => ({
      description: tool.description,
      name: tool.name,
      parameters: {
        type: 'object',
      },
    })),
  }
}

function createUserMessage(text: string): LLMMessage {
  return {
    content: [
      {
        text,
        type: ContentKind.Text,
      },
    ],
    role: LLMMessageRole.User,
  }
}

function createToolUseResponse(
  toolUseId: string,
  toolName: string,
  input: Record<string, unknown>,
  usage: TokenUsage = { inputTokens: 10, outputTokens: 4 },
): LLMResponse {
  return {
    content: [
      {
        id: toolUseId,
        input,
        name: toolName,
        type: ContentKind.ToolUse,
      },
    ],
    model: 'test-model',
    stopReason: LLMStopReason.ToolUse,
    usage,
  }
}

function createCompletedResponse(
  text: string,
  usage: TokenUsage = { inputTokens: 2, outputTokens: 3 },
): LLMResponse {
  return {
    content: [
      {
        text,
        type: ContentKind.Text,
      },
    ],
    model: 'test-model',
    stopReason: LLMStopReason.Completed,
    usage,
  }
}
