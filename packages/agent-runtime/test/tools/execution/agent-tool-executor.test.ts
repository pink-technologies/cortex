// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind, type ToolUseContent } from '@cortex/llm'
import { z } from 'zod'
import {
  AgentToolEffect,
  AgentToolExecutionError,
  AgentToolExecutor,
  AgentToolIdempotency,
  AgentToolInputValidationError,
  AgentToolNotFoundError,
  AgentToolOutputValidationError,
  AgentToolPermissionDeniedError,
  AgentToolRegistry,
  type AgentTool,
} from '../../../src/tools'
import { createAgentExecutionContextFixture } from '../../fixtures/execution'
import { createFailingAgentTool, createTestAddTool } from '../../fixtures/tool'

/**
 * Builds a {@link ToolUseContent} block for executor tests.
 */
function createToolUse(
  overrides: {
    readonly id?: string
    readonly input?: Record<string, unknown>
    readonly name?: string
  } = {},
): ToolUseContent {
  return {
    id: overrides.id ?? 'tool-use-1',
    input: overrides.input ?? { left: 2, right: 3 },
    name: overrides.name ?? 'test.add',
    type: ContentKind.ToolUse,
  }
}

/**
 * Creates a tool that returns a value that fails {@link AgentTool.outputSchema}.
 */
function createInvalidOutputTool(): AgentTool<{ readonly value: string }, { readonly value: number }> {
  return {
    description: 'Returns a string while declaring a numeric output schema.',
    inputSchema: z.object({
      value: z.string(),
    }),
    metadata: {
      effect: AgentToolEffect.Read,
      idempotency: AgentToolIdempotency.Idempotent,
      permissions: [],
    },
    name: 'test.invalid-output',
    outputSchema: z.object({
      value: z.number(),
    }),
    async execute(input) {
      return { value: input.value as unknown as number }
    },
  }
}

/**
 * Creates a tool that requires a permission not granted by default fixtures.
 */
function createPermissionGatedTool(
  permissions: readonly string[],
): AgentTool<Record<string, never>, { readonly ok: true }> {
  return {
    description: 'Requires explicit permissions before execution.',
    inputSchema: z.object({}),
    metadata: {
      effect: AgentToolEffect.Write,
      idempotency: AgentToolIdempotency.Idempotent,
      permissions,
    },
    name: 'test.gated',
    outputSchema: z.object({
      ok: z.literal(true),
    }),
    async execute() {
      return { ok: true as const }
    },
  }
}

describe('AgentToolExecutor', () => {
  describe('Given an unknown tool name', () => {
    describe('When execute is called', () => {
      it('Then throws AgentToolNotFoundError', async () => {
        const executor = new AgentToolExecutor(new AgentToolRegistry())

        await expect(
          executor.execute(createToolUse({ name: 'missing.tool' }), createAgentExecutionContextFixture()),
        ).rejects.toBeInstanceOf(AgentToolNotFoundError)

        await expect(
          executor.execute(createToolUse({ name: 'missing.tool' }), createAgentExecutionContextFixture()),
        ).rejects.toMatchObject({
          code: 'AGENT_TOOL_NOT_FOUND',
          message: 'Tool not found: missing.tool',
        })
      })
    })
  })

  describe('Given a tool that requires a permission the context lacks', () => {
    describe('When execute is called', () => {
      it('Then throws AgentToolPermissionDeniedError with the missing permission and toolUse id', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createPermissionGatedTool(['repo.write']))
        const executor = new AgentToolExecutor(registry)
        const toolUse = createToolUse({
          id: 'tool-use-permission',
          input: {},
          name: 'test.gated',
        })

        await expect(executor.execute(toolUse, createAgentExecutionContextFixture())).rejects.toBeInstanceOf(
          AgentToolPermissionDeniedError,
        )

        await expect(executor.execute(toolUse, createAgentExecutionContextFixture())).rejects.toMatchObject({
          code: 'AGENT_TOOL_PERMISSION_DENIED',
          missingPermissions: ['repo.write'],
          toolName: 'test.gated',
          toolUseId: 'tool-use-permission',
        })
      })
    })
  })

  describe('Given invalid tool input', () => {
    describe('When execute is called', () => {
      it('Then throws AgentToolInputValidationError preserving the toolUse id', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createTestAddTool())
        const executor = new AgentToolExecutor(registry)
        const toolUse = createToolUse({
          id: 'tool-use-input',
          input: { left: 'two', right: 3 },
        })

        try {
          await executor.execute(toolUse, createAgentExecutionContextFixture())
          throw new Error('Expected AgentToolInputValidationError')
        } catch (error) {
          expect(error).toBeInstanceOf(AgentToolInputValidationError)
          expect(error).toMatchObject({
            code: 'AGENT_TOOL_INPUT_VALIDATION_ERROR',
            toolName: 'test.add',
            toolUseId: 'tool-use-input',
          })
          expect((error as AgentToolInputValidationError).validationError).toBeDefined()
        }
      })
    })
  })

  describe('Given a registered tool with valid input and granted permissions', () => {
    describe('When execute succeeds', () => {
      it('Then returns the validated output and preserves the original toolUse id', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createTestAddTool())
        const executor = new AgentToolExecutor(registry)
        const toolUse = createToolUse({
          id: 'tool-use-success',
          input: { left: 2, right: 3 },
        })

        const result = await executor.execute(toolUse, createAgentExecutionContextFixture())

        expect(result).toEqual({
          output: { value: 5 },
          toolName: 'test.add',
          toolUseId: 'tool-use-success',
        })
      })
    })
  })

  describe('Given a tool handler that throws', () => {
    describe('When execute is called', () => {
      it('Then wraps the failure in AgentToolExecutionError preserving the toolUse id', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createFailingAgentTool({ message: 'boom' }))
        const executor = new AgentToolExecutor(registry)
        const toolUse = createToolUse({
          id: 'tool-use-failure',
          input: {},
          name: 'test.fail',
        })

        try {
          await executor.execute(toolUse, createAgentExecutionContextFixture())
          throw new Error('Expected AgentToolExecutionError')
        } catch (error) {
          expect(error).toBeInstanceOf(AgentToolExecutionError)
          expect(error).toMatchObject({
            code: 'AGENT_TOOL_EXECUTION_ERROR',
            toolName: 'test.fail',
            toolUseId: 'tool-use-failure',
          })
          expect((error as AgentToolExecutionError).cause).toEqual({
            cause: expect.objectContaining({ message: 'boom' }),
          })
        }
      })
    })

    describe('When the execution signal is aborted during the failure', () => {
      it('Then surfaces the abort instead of wrapping the tool error', async () => {
        const controller = new AbortController()
        const registry = new AgentToolRegistry()
        registry.register({
          description: 'Aborts the signal then fails.',
          inputSchema: z.object({}),
          metadata: {
            effect: AgentToolEffect.Execute,
            idempotency: AgentToolIdempotency.NonIdempotent,
            permissions: [],
          },
          name: 'test.abort-then-fail',
          outputSchema: z.never(),
          async execute() {
            controller.abort()
            throw new Error('boom')
          },
        })
        const executor = new AgentToolExecutor(registry)

        try {
          await executor.execute(
            createToolUse({ input: {}, name: 'test.abort-then-fail' }),
            createAgentExecutionContextFixture({ signal: controller.signal }),
          )
          throw new Error('Expected abort rejection')
        } catch (error) {
          expect(error).not.toBeInstanceOf(AgentToolExecutionError)
          expect(controller.signal.aborted).toBe(true)
        }
      })
    })
  })

  describe('Given a tool that returns invalid output', () => {
    describe('When execute is called', () => {
      it('Then throws AgentToolOutputValidationError preserving the toolUse id', async () => {
        const registry = new AgentToolRegistry()
        registry.register(createInvalidOutputTool())
        const executor = new AgentToolExecutor(registry)
        const toolUse = createToolUse({
          id: 'tool-use-output',
          input: { value: 'not-a-number' },
          name: 'test.invalid-output',
        })

        try {
          await executor.execute(toolUse, createAgentExecutionContextFixture())
          throw new Error('Expected AgentToolOutputValidationError')
        } catch (error) {
          expect(error).toBeInstanceOf(AgentToolOutputValidationError)
          expect(error).toMatchObject({
            code: 'AGENT_TOOL_OUTPUT_VALIDATION_ERROR',
            toolName: 'test.invalid-output',
            toolUseId: 'tool-use-output',
          })
          expect((error as AgentToolOutputValidationError).validationError).toBeDefined()
        }
      })
    })
  })
})
