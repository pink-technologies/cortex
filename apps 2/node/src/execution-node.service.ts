// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { setTimeout as delay } from 'node:timers/promises'
import { ExecutionJobClient } from './execution/execution-job-client'
import { NODE_CONFIGURATION, type NodeConfiguration } from './configuration/node-configuration'
import { SystemTestExecutor } from './execution/system-test.executor'
import {
  type ClaimExecutionJobRequest,
  type ExecutionJob as ProtocolExecutionJob,
} from '@cortex/protocol'

import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common'

/**
 * Coordinates execution-job processing for the Cortex Node.
 *
 * The service continuously requests compatible jobs from the Cortex API,
 * executes supported job kinds, and reports the resulting terminal state.
 *
 * Jobs are executed sequentially. The node does not request another job until
 * the current job has completed or failed.
 */
@Injectable()
export class ExecutionNodeService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  // MARK: - Private Properties

  private readonly abortController = new AbortController()

  private readonly logger = new Logger(ExecutionNodeService.name)

  private executionTask?: Promise<void>

  // MARK: - Constructor

  /**
   * Creates the execution node service.
   *
   * @param configuration - Validated Cortex Node configuration.
   * @param executionJobClient - Client used to communicate with the Cortex API.
   * @param systemTestExecutor - Executor for `system.test` jobs.
   */
  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
    private readonly executionJobClient: ExecutionJobClient,
    private readonly systemTestExecutor: SystemTestExecutor,
  ) {}

  // MARK: - OnApplicationBootstrap

  /**
   * Starts the execution-job polling loop.
   */
  onApplicationBootstrap(): void {
    this.executionTask = this.run()
  }

  // MARK: - OnApplicationShutdown

  /**
   * Stops polling and waits for the execution loop to terminate.
   */
  async onApplicationShutdown(): Promise<void> {
    this.abortController.abort()

    await this.executionTask
  }

  // MARK: - Private Methods

  /**
   * Continuously claims and executes compatible jobs until the application
   * shuts down.
   */
  private async run(): Promise<void> {
    const signal = this.abortController.signal

    this.logger.log(`Cortex Node ${this.configuration.nodeId} started`)

    while (!signal.aborted) {
      try {
        const result = await this.executionJobClient.claimNextAvailable(
          this.createClaimRequest(),
        )

        if (!result) {
          await this.waitForNextPoll()
          continue
        }

        await this.process(result.job)
      } catch (error) {
        if (signal.aborted) {
          break
        }

        this.logger.error(
          'Execution-job polling failed',
          error instanceof Error ? error.stack : String(error),
        )

        await this.waitForNextPoll()
      }
    }

    this.logger.log(`Cortex Node ${this.configuration.nodeId} stopped`)
  }

  /**
   * Creates the claim request describing the node and its supported work.
   */
  private createClaimRequest(): ClaimExecutionJobRequest {
    return {
      capabilities: ['os.macos'],
      labels: [`architecture.${process.arch}`],
      leaseDurationSeconds: 60,
      nodeId: this.configuration.nodeId,
      supportedKinds: ['system.test'],
    }
  }

  /**
   * Executes a claimed job and reports its final state to the Cortex API.
   *
   * @param executionJob - Claimed protocol execution job.
   */
  private async process(executionJob: ProtocolExecutionJob): Promise<void> {
    this.logger.log(
      `Processing execution job ${executionJob.id} (${executionJob.kind})`,
    )

    try {
      await this.execute(executionJob)
    } catch (error) {
      this.logger.error(
        `Execution job ${executionJob.id} failed`,
        error instanceof Error ? error.stack : String(error),
      )

      await this.executionJobClient.fail(executionJob.id)

      return
    }

    await this.executionJobClient.complete(executionJob.id)

    this.logger.log(`Execution job ${executionJob.id} completed`)
  }

  /**
   * Routes a claimed job to its corresponding executor.
   *
   * @param executionJob - Execution job to run.
   * @throws Error When the job kind is unsupported by this node.
   */
  private async execute(executionJob: ProtocolExecutionJob): Promise<void> {
    switch (executionJob.kind) {
      case 'system.test':
        await this.systemTestExecutor.execute(executionJob)
        return

      default:
        throw new Error(`Unsupported execution job kind: ${executionJob.kind}`)
    }
  }

  /**
   * Suspends polling for the configured interval.
   */
  private async waitForNextPoll(): Promise<void> {
    try {
      await delay(this.configuration.pollIntervalMilliseconds, undefined, {
        signal: this.abortController.signal,
      })
    } catch (error) {
      if (!this.abortController.signal.aborted) {
        throw error
      }
    }
  }
}
