// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ExecutionJobHandler } from '../../../src/execution/handler/execution-job-handler'
import { ExecutionJobHandlerRegistry } from '../../../src/execution/handler/execution-job-handler-registry'
import {
  ExecutionJobHandlerAlreadyRegisteredError,
  ExecutionJobHandlerNotFoundError,
} from '../../../src/execution/handler/error/error'
import type { ExecutionJobProcessingResult } from '../../../src/execution/jobs/processing'

/**
 * Creates an execution-job handler test double for the given kind.
 */
function makeHandler(
  kind: string,
): ExecutionJobHandler<ExecutionJobProcessingResult> {
  return {
    kind,
    process: jest.fn().mockResolvedValue(undefined),
  }
}

describe('ExecutionJobHandlerRegistry', () => {
  it('resolves a registered handler', () => {
    const agentExecuteHandler = makeHandler('agent.execute')
    const systemTestHandler = makeHandler('system.test')
    const registry = new ExecutionJobHandlerRegistry([
      agentExecuteHandler,
      systemTestHandler,
    ])

    expect(registry.resolve('agent.execute')).toBe(agentExecuteHandler)
    expect(registry.resolve('system.test')).toBe(systemTestHandler)
  })

  it('returns all registered kinds', () => {
    const registry = new ExecutionJobHandlerRegistry([
      makeHandler('agent.execute'),
      makeHandler('system.test'),
    ])

    expect(registry.supportedKinds()).toEqual(['agent.execute', 'system.test'])
  })

  it('throws when a kind is missing', () => {
    const registry = new ExecutionJobHandlerRegistry([
      makeHandler('agent.execute'),
    ])

    expect(() => registry.resolve('skill.run')).toThrow(
      ExecutionJobHandlerNotFoundError,
    )

    try {
      registry.resolve('skill.run')
      fail('expected resolve to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ExecutionJobHandlerNotFoundError)
      expect((error as ExecutionJobHandlerNotFoundError).kind).toBe('skill.run')
    }
  })

  it('throws when two handlers use the same kind', () => {
    const handlers = [makeHandler('agent.execute'), makeHandler('agent.execute')]

    expect(() => new ExecutionJobHandlerRegistry(handlers)).toThrow(
      ExecutionJobHandlerAlreadyRegisteredError,
    )

    try {
      new ExecutionJobHandlerRegistry(handlers)
      fail('expected construction to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ExecutionJobHandlerAlreadyRegisteredError)
      expect(
        (error as ExecutionJobHandlerAlreadyRegisteredError).kind,
      ).toBe('agent.execute')
    }
  })
})
