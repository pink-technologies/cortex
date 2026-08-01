// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type {
  ExecutionJobHandler,
  ExecutionJobHandlerContext,
  ExecutionJobHandlerRegistry,
} from '../../../../src/execution/handler'
import { ExecutionJobHandlerNotFoundError } from '../../../../src/execution/handler'
import {
  ExecutionJobProcessor,
  type ClaimedExecutionJob,
  type ExecutionJobProcessingResult,
} from '../../../../src/execution/jobs/processing'

/**
 * Creates a claimed execution job for processor tests.
 */
function makeClaimedJob(
  overrides: Partial<ClaimedExecutionJob> = {},
): ClaimedExecutionJob {
  return {
    id: 'execution-job-1',
    kind: 'system.test',
    payload: {
      input: 'Add two and three.',
    },
    ...overrides,
  } as ClaimedExecutionJob
}

/**
 * Creates a generic execution-job handler test double.
 */
function makeHandler(
  result: ExecutionJobProcessingResult = undefined,
): {
  handler: ExecutionJobHandler<ExecutionJobProcessingResult>
  process: jest.MockedFunction<
    (
      payload: unknown,
      context: ExecutionJobHandlerContext,
    ) => Promise<ExecutionJobProcessingResult>
  >
} {
  const process = jest.fn<
    Promise<ExecutionJobProcessingResult>,
    [unknown, ExecutionJobHandlerContext]
  >()

  process.mockResolvedValue(result)

  return {
    handler: {
      kind: 'system.test',
      process,
    },
    process,
  }
}

/**
 * Creates an ExecutionJobHandlerRegistry test double resolving to a handler.
 */
function makeRegistry(
  handler: ExecutionJobHandler<ExecutionJobProcessingResult>,
): {
  registry: ExecutionJobHandlerRegistry
  resolve: jest.MockedFunction<
    (kind: string) => ExecutionJobHandler<ExecutionJobProcessingResult>
  >
} {
  const resolve = jest.fn<
    ExecutionJobHandler<ExecutionJobProcessingResult>,
    [string]
  >()

  resolve.mockReturnValue(handler)

  return {
    registry: {
      resolve,
    } as unknown as ExecutionJobHandlerRegistry,
    resolve,
  }
}

describe('ExecutionJobProcessor', () => {
  it('resolves the handler using the job kind', async () => {
    const { handler } = makeHandler()
    const { registry, resolve } = makeRegistry(handler)
    const processor = new ExecutionJobProcessor(registry)

    await processor.process(
      makeClaimedJob({ kind: 'system.test' }),
      new AbortController().signal,
    )

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(resolve).toHaveBeenCalledWith('system.test')
  })

  it('passes the job payload to the handler unchanged', async () => {
    const payload = {
      input: 'Add two and three.',
      toolNames: ['test.add'],
    }

    const { handler, process } = makeHandler()
    const { registry } = makeRegistry(handler)
    const processor = new ExecutionJobProcessor(registry)

    await processor.process(
      makeClaimedJob({ payload }),
      new AbortController().signal,
    )

    expect(process).toHaveBeenCalledTimes(1)
    expect(process.mock.calls[0]?.[0]).toBe(payload)
  })

  it('passes the execution id and cancellation signal to the handler', async () => {
    const controller = new AbortController()
    const { handler, process } = makeHandler()
    const { registry } = makeRegistry(handler)
    const processor = new ExecutionJobProcessor(registry)

    await processor.process(
      makeClaimedJob({ id: 'execution-job-42' }),
      controller.signal,
    )

    const context = process.mock.calls[0]?.[1]

    expect(context?.executionId).toBe('execution-job-42')
    expect(context?.signal).toBe(controller.signal)
  })

  it('returns the handler result', async () => {
    const expectedResult = {
      executionId: 'execution-job-1',
      iterationCount: 2,
      output: 'The result is 5.',
      usage: {
        inputTokens: 20,
        outputTokens: 8,
        totalTokens: 28,
      },
    }

    const { handler } = makeHandler(expectedResult)
    const { registry } = makeRegistry(handler)
    const processor = new ExecutionJobProcessor(registry)

    const result = await processor.process(
      makeClaimedJob(),
      new AbortController().signal,
    )

    expect(result).toBe(expectedResult)
  })

  it('propagates handler failures', async () => {
    const expectedError = new Error('Job execution failed')
    const { handler, process } = makeHandler()

    process.mockRejectedValue(expectedError)

    const { registry } = makeRegistry(handler)
    const processor = new ExecutionJobProcessor(registry)

    await expect(
      processor.process(
        makeClaimedJob(),
        new AbortController().signal,
      ),
    ).rejects.toBe(expectedError)
  })

  it('propagates registry resolution failures', async () => {
    const expectedError = new ExecutionJobHandlerNotFoundError('unknown.job')
    const { handler, process } = makeHandler()
    const { registry, resolve } = makeRegistry(handler)

    resolve.mockImplementation(() => {
      throw expectedError
    })

    const processor = new ExecutionJobProcessor(registry)

    await expect(
      processor.process(
        makeClaimedJob({ kind: 'unknown.job' }),
        new AbortController().signal,
      ),
    ).rejects.toBe(expectedError)

    expect(process).not.toHaveBeenCalled()
  })

  it('does not resolve a handler when already cancelled', async () => {
    const controller = new AbortController()
    const { handler, process } = makeHandler()
    const { registry, resolve } = makeRegistry(handler)
    const processor = new ExecutionJobProcessor(registry)

    controller.abort()

    await expect(
      processor.process(
        makeClaimedJob(),
        controller.signal,
      ),
    ).rejects.toMatchObject({
      name: 'AbortError',
    })

    expect(resolve).not.toHaveBeenCalled()
    expect(process).not.toHaveBeenCalled()
  })
})
