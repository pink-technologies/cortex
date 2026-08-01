// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentExecuteJobKind } from '@cortex/protocol'
import type { NodeConfiguration } from '../../../../src/configuration'
import { CortexExecutionJobResource } from '../../../../src/cortex'
import { ExecutionJobPoller } from '../../../../src/execution/jobs/polling'
import {
  ExecutionJobProcessor,
  type ClaimedExecutionJob,
  type ExecutionJobProcessingResult,
} from '../../../../src/execution/jobs/processing'

/**
 * Creates the minimum Node configuration required by the poller.
 */
function makeConfiguration(): NodeConfiguration {
  return {
    pollingIntervalMilliseconds: 1_000,
  } as NodeConfiguration
}

/**
 * Creates a claimed agent-execution job.
 */
function makeClaimedJob(): ClaimedExecutionJob {
  return {
    id: 'execution-job-1',
    claimToken: '11111111-1111-1111-1111-111111111111',
    kind: AgentExecuteJobKind,
    payload: {
      agentId: 'assistant',
      input: 'Add two and three.',
      toolNames: ['test.add'],
    },
  } as ClaimedExecutionJob
}

/**
 * Creates an agent-execution result.
 */
function makeProcessingResult(): ExecutionJobProcessingResult {
  return {
    executionId: 'execution-job-1',
    iterationCount: 2,
    output: 'The result is 5.',
    usage: {
      inputTokens: 20,
      outputTokens: 8,
      totalTokens: 28,
    },
  }
}

/**
 * Creates an execution-job client test double.
 */
function makeCortexExecutionJobResource(): {
  claimNextAvailable: jest.Mock
  complete: jest.Mock
  fail: jest.Mock
  client: CortexExecutionJobResource
} {
  const claimNextAvailable = jest.fn()
  const complete = jest.fn()
  const fail = jest.fn()

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

/**
 * Creates an execution-job processor test double.
 */
function makeExecutionJobProcessor(): {
  process: jest.Mock
  processor: ExecutionJobProcessor
} {
  const process = jest.fn()

  return {
    process,
    processor: {
      process,
    } as unknown as ExecutionJobProcessor,
  }
}

describe('ExecutionJobPoller', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('claims, processes, and completes an available job', async () => {
    const controller = new AbortController()
    const job = makeClaimedJob()
    const result = makeProcessingResult()
    const {
      claimNextAvailable,
      complete,
      fail,
      client,
    } = makeCortexExecutionJobResource()
    const {
      process,
      processor,
    } = makeExecutionJobProcessor()

    claimNextAvailable.mockResolvedValue({
      job,
    })

    process.mockResolvedValue(result)

    complete.mockImplementation(async () => {
      controller.abort()
    })

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    await poller.run(
      'node-1',
      controller.signal,
    )

    expect(claimNextAvailable).toHaveBeenCalledTimes(1)
    expect(claimNextAvailable).toHaveBeenCalledWith(
      'node-1',
      controller.signal,
    )

    expect(process).toHaveBeenCalledTimes(1)
    expect(process).toHaveBeenCalledWith(
      job,
      controller.signal,
    )

    expect(complete).toHaveBeenCalledTimes(1)
    expect(complete).toHaveBeenCalledWith(
      job.id,
      {
        claimToken: job.claimToken,
        nodeId: 'node-1',
        result,
      },
      controller.signal,
    )

    expect(fail).not.toHaveBeenCalled()
  })

  it('does not process or complete when no job is available', async () => {
    const controller = new AbortController()
    const {
      claimNextAvailable,
      complete,
      fail,
      client,
    } = makeCortexExecutionJobResource()
    const {
      process,
      processor,
    } = makeExecutionJobProcessor()

    claimNextAvailable.mockImplementation(async () => {
      controller.abort()

      return {
        job: null,
      }
    })

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    await poller.run(
      'node-1',
      controller.signal,
    )

    expect(claimNextAvailable).toHaveBeenCalledTimes(1)
    expect(process).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    expect(fail).not.toHaveBeenCalled()
  })

  it('reports the job as failed when processing fails', async () => {
    const controller = new AbortController()
    const expectedError = new Error('Agent execution failed')
    const job = makeClaimedJob()
    const {
      claimNextAvailable,
      complete,
      fail,
      client,
    } = makeCortexExecutionJobResource()
    const {
      process,
      processor,
    } = makeExecutionJobProcessor()

    claimNextAvailable.mockResolvedValue({
      job,
    })

    process.mockRejectedValue(expectedError)

    fail.mockImplementation(async () => {
      controller.abort()
    })

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    await poller.run(
      'node-1',
      controller.signal,
    )

    expect(process).toHaveBeenCalledWith(
      job,
      controller.signal,
    )

    expect(fail).toHaveBeenCalledTimes(1)
    expect(fail).toHaveBeenCalledWith(
      job.id,
      {
        claimToken: job.claimToken,
        failure: {
          code: 'Error',
          message: 'Agent execution failed',
        },
        nodeId: 'node-1',
      },
      controller.signal,
    )
    expect(complete).not.toHaveBeenCalled()
  })

  it('does not mark the job as failed when completion reporting fails', async () => {
    const controller = new AbortController()
    const job = makeClaimedJob()
    const result = makeProcessingResult()
    const {
      claimNextAvailable,
      complete,
      fail,
      client,
    } = makeCortexExecutionJobResource()
    const {
      process,
      processor,
    } = makeExecutionJobProcessor()

    claimNextAvailable.mockResolvedValue({
      job,
    })

    process.mockResolvedValue(result)

    complete.mockImplementation(async () => {
      controller.abort()

      throw new Error(
        'Completion request failed',
      )
    })

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    await poller.run(
      'node-1',
      controller.signal,
    )

    expect(process).toHaveBeenCalledTimes(1)

    expect(complete).toHaveBeenCalledWith(
      job.id,
      {
        claimToken: job.claimToken,
        nodeId: 'node-1',
        result,
      },
      controller.signal,
    )

    expect(fail).not.toHaveBeenCalled()
  })

  it('does not claim work when the signal is already aborted', async () => {
    const controller = new AbortController()
    const {
      claimNextAvailable,
      client,
    } = makeCortexExecutionJobResource()
    const {
      process,
      processor,
    } = makeExecutionJobProcessor()

    controller.abort()

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    await poller.run(
      'node-1',
      controller.signal,
    )

    expect(claimNextAvailable).not.toHaveBeenCalled()
    expect(process).not.toHaveBeenCalled()
  })

  it('reports failure even when job execution cancels', async () => {
    const controller = new AbortController()
    const job = makeClaimedJob()
    const {
      claimNextAvailable,
      complete,
      fail,
      client,
    } = makeCortexExecutionJobResource()
    const {
      process,
      processor,
    } = makeExecutionJobProcessor()

    claimNextAvailable.mockResolvedValue({
      job,
    })

    process.mockImplementation(async () => {
      controller.abort()
      controller.signal.throwIfAborted()
    })

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    await poller.run(
      'node-1',
      controller.signal,
    )

    expect(fail).toHaveBeenCalledTimes(1)
    expect(fail).toHaveBeenCalledWith(
      job.id,
      {
        claimToken: job.claimToken,
        failure: {
          code: 'EXECUTION_JOB_FAILED',
          message: 'Execution job failed with an unknown error',
        },
        nodeId: 'node-1',
      },
      controller.signal,
    )
    expect(complete).not.toHaveBeenCalled()
  })

  it('stops polling after logging a processing error', async () => {
    const job = makeClaimedJob()
    const {
      claimNextAvailable,
      fail,
      client,
    } = makeCortexExecutionJobResource()
    const {
      process,
      processor,
    } = makeExecutionJobProcessor()

    claimNextAvailable.mockResolvedValue({ job })
    process.mockRejectedValue(new Error('Agent execution failed'))
    fail.mockResolvedValue(undefined)

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    await poller.run('node-1', new AbortController().signal)

    expect(fail).toHaveBeenCalledWith(
      job.id,
      {
        claimToken: job.claimToken,
        failure: {
          code: 'Error',
          message: 'Agent execution failed',
        },
        nodeId: 'node-1',
      },
      expect.any(AbortSignal),
    )
    expect(claimNextAvailable).toHaveBeenCalledTimes(1)
  })

  it('stops polling after logging an unknown processing error', async () => {
    const job = makeClaimedJob()
    const {
      claimNextAvailable,
      fail,
      client,
    } = makeCortexExecutionJobResource()
    const {
      process,
      processor,
    } = makeExecutionJobProcessor()

    claimNextAvailable.mockResolvedValue({ job })
    process.mockRejectedValue('boom')
    fail.mockResolvedValue(undefined)

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    await poller.run('node-1', new AbortController().signal)

    expect(fail).toHaveBeenCalledWith(
      job.id,
      {
        claimToken: job.claimToken,
        failure: {
          code: 'EXECUTION_JOB_FAILED',
          message: 'Execution job failed with an unknown error',
        },
        nodeId: 'node-1',
      },
      expect.any(AbortSignal),
    )
  })

  it('throws AggregateError when failure reporting also fails', async () => {
    const job = makeClaimedJob()
    const {
      claimNextAvailable,
      fail,
      client,
    } = makeCortexExecutionJobResource()
    const {
      process,
      processor,
    } = makeExecutionJobProcessor()

    claimNextAvailable.mockResolvedValue({ job })
    process.mockRejectedValue(new Error('Agent execution failed'))
    fail.mockRejectedValue(new Error('Failure request failed'))

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    await poller.run('node-1', new AbortController().signal)

    expect(fail).toHaveBeenCalledWith(
      job.id,
      {
        claimToken: job.claimToken,
        failure: {
          code: 'Error',
          message: 'Agent execution failed',
        },
        nodeId: 'node-1',
      },
      expect.any(AbortSignal),
    )
  })

  it('waits before claiming again when no job is available', async () => {
    jest.useFakeTimers()

    const controller = new AbortController()
    const {
      claimNextAvailable,
      client,
    } = makeCortexExecutionJobResource()
    const { processor } = makeExecutionJobProcessor()

    claimNextAvailable
      .mockResolvedValueOnce({ job: null })
      .mockImplementationOnce(async () => {
        controller.abort()

        return { job: null }
      })

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    const runPromise = poller.run('node-1', controller.signal)

    await Promise.resolve()
    await jest.advanceTimersByTimeAsync(1_000)
    await runPromise

    expect(claimNextAvailable).toHaveBeenCalledTimes(2)
  })

  it('wakes early from the polling delay when cancelled', async () => {
    jest.useFakeTimers()

    const controller = new AbortController()
    const {
      claimNextAvailable,
      client,
    } = makeCortexExecutionJobResource()
    const { processor } = makeExecutionJobProcessor()

    claimNextAvailable.mockResolvedValue({ job: null })

    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    const runPromise = poller.run('node-1', controller.signal)

    await Promise.resolve()
    controller.abort()
    await runPromise

    expect(claimNextAvailable).toHaveBeenCalledTimes(1)
  })

  it('resolves immediately when the wait starts with an aborted signal', async () => {
    const controller = new AbortController()
    const { client } = makeCortexExecutionJobResource()
    const { processor } = makeExecutionJobProcessor()
    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    controller.abort()

    await (
      poller as unknown as {
        waitForNextAttempt(signal: AbortSignal): Promise<void>
      }
    ).waitForNextAttempt(controller.signal)
  })

  it('ignores a second wait completion after the delay elapses', async () => {
    jest.useFakeTimers()

    const controller = new AbortController()
    const { client } = makeCortexExecutionJobResource()
    const { processor } = makeExecutionJobProcessor()
    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    const waitPromise = (
      poller as unknown as {
        waitForNextAttempt(signal: AbortSignal): Promise<void>
      }
    ).waitForNextAttempt(controller.signal)

    await jest.advanceTimersByTimeAsync(1_000)
    controller.abort()
    await waitPromise
  })

  it('finishes the wait when the signal is aborted during setup', async () => {
    const controller = new AbortController()
    const { client } = makeCortexExecutionJobResource()
    const { processor } = makeExecutionJobProcessor()
    const poller = new ExecutionJobPoller(
      makeConfiguration(),
      client,
      processor,
    )

    const originalAddEventListener = controller.signal.addEventListener.bind(controller.signal)

    jest.spyOn(controller.signal, 'addEventListener').mockImplementation((type, listener, options) => {
      originalAddEventListener(type, listener as EventListener, options)
      controller.abort()
    })

    await (
      poller as unknown as {
        waitForNextAttempt(signal: AbortSignal): Promise<void>
      }
    ).waitForNextAttempt(controller.signal)
  })
})
