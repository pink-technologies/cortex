// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable, Logger } from '@nestjs/common'
import { CompleteExecutionJobRequest, FailExecutionJobRequest } from '@cortex/protocol'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../../../configuration'
import { CortexExecutionJobResource } from '../../../cortex'
import { ExecutionJobProcessor, mapExecutionJobFailure, type ClaimedExecutionJob } from '../processing'

/**
 * Periodically claims and executes jobs assigned to a registered Cortex Node.
 *
 * Jobs are processed sequentially. The poller does not claim another job until
 * the current job has completed or failed. Handler and engine failures are
 * reported through the fail API; the polling loop stays alive so later jobs
 * can still be claimed.
 */
@Injectable()
export class ExecutionJobPoller {
  // MARK: - Private Properties

  private readonly logger = new Logger(ExecutionJobPoller.name)

  // MARK: - Constructor

  /**
   * Creates an execution-job poller.
   *
   * @param configuration - Validated Cortex Node configuration.
   * @param executionJobs - Resource used to claim and report execution jobs.
   * @param executionJobProcessor - Processor used to execute claimed jobs.
   */
  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
    private readonly executionJobs: CortexExecutionJobResource,
    private readonly executionJobProcessor: ExecutionJobProcessor,
  ) {}

  // MARK: - Instance methods

  /**
   * Polls and processes execution jobs until cancellation.
   *
   * Claim, processing, and reporting failures are logged without terminating
   * the loop. A delay is applied whenever no job is available or an operation
   * fails so the Node keeps attempting work.
   *
   * @param nodeId - Registered Cortex Node identifier.
   * @param signal - Signal used to stop polling and active execution.
   */
  async run(nodeId: string, signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      let didExecuteJob = false

      try {
        didExecuteJob = await this.executeNextAvailable(nodeId, signal)
      } catch (error) {
        if (signal.aborted) {
          return
        }

        if (error instanceof Error) {
          this.logger.error(
            `Execution-job polling failed: ${error.message}`,
            error.stack,
          )
        } else {
          this.logger.error(
            `Execution-job polling failed with an unknown error: ${String(error)}`,
          )
        }
      }

      if (!didExecuteJob && !signal.aborted) {
        await this.waitForNextAttempt(signal)
      }
    }
  }

  // MARK: - Private methods

  private async executeNextAvailable(nodeId: string, signal: AbortSignal): Promise<boolean> {
    signal.throwIfAborted()

    const response = await this.executionJobs.claimNextAvailable(nodeId, signal)
    const job = response.job

    if (!job) {
      return false
    }

    if (job.claimToken === null) {
      throw new Error('Claim token is null not able to complete the job')
    }

    this.logger.log(`Executing job ${job.id} (${job.kind})`)

    let result

    try {
      result = await this.executionJobProcessor.process(job, signal)
    } catch (error) {
      await this.reportFailure(job, nodeId, error, signal)

      if (error instanceof Error) {
        this.logger.error(
          `Execution job ${job.id} failed: ${error.message}`,
          error.stack,
        )
      } else {
        this.logger.error(
          `Execution job ${job.id} failed with an unknown error: ${String(error)}`,
        )
      }

      return true
    }

    const request: CompleteExecutionJobRequest = {
      claimToken: job.claimToken,
      nodeId,
      result,
    }

    await this.executionJobs.complete(job.id, request, signal)

    this.logger.log(`Execution job ${job.id} completed`)

    return true
  }

  private async reportFailure(
    job: ClaimedExecutionJob,
    nodeId: string,
    executionError: unknown,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      if (job.claimToken === null) {
        throw new Error('Claim token is null not able to fail the job')
      }

      const request: FailExecutionJobRequest = {
        claimToken: job.claimToken,
        nodeId,
        failure: mapExecutionJobFailure(executionError),
      }

      await this.executionJobs.fail(job.id, request, signal)
    } catch (reportingError) {
      throw new AggregateError(
        [executionError, reportingError],
        `Execution job '${job.id}' failed and its failure could not be reported.`,
      )
    }
  }

  private waitForNextAttempt(signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      let settled = false

      const finish = (): void => {
        if (settled) {
          return
        }

        settled = true

        clearTimeout(timer)
        signal.removeEventListener('abort', handleAbort)

        resolve()
      }

      const handleAbort = (): void => {
        finish()
      }

      const timer = setTimeout(finish, this.configuration.pollingIntervalMilliseconds)

      signal.addEventListener('abort', handleAbort, {
        once: true,
      })

      if (signal.aborted) {
        finish()
      }
    })
  }
}
