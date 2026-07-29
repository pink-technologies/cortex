// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { setTimeout as delay } from 'node:timers/promises'
import { ExecutionJobClient } from './jobs/execution-job-client'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../configuration/node-configuration'
import { NodeDescriptorProvider } from '../node/node-descriptor.provider'
import { SystemTestExecutor } from './jobs/system-test.executor'
import { NodeIdentityStore } from '../node/node-identity-store'
import { ExecutionNodeClient } from '../node/execution-node.client'
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
    @Inject()
    private readonly nodeDescriptorProvider: NodeDescriptorProvider,
    @Inject()
    private readonly identityStore: NodeIdentityStore,
    private readonly executionJobClient: ExecutionJobClient,
    private readonly executionNodeClient: ExecutionNodeClient,
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

  // MARK: - Private methods

  private async run(): Promise<void> {
    const identity =  await this.identityStore.loadOrCreate()
    const descriptor = this.nodeDescriptorProvider.create()
    const registration = await this.executionNodeClient.register(
      {
        ...descriptor,
        installationId: identity.installationId,
        name: this.configuration.nodeName,
        version: this.configuration.version
      }
    )    

    this.logger.log(
      `Cortex Node registered as ${registration.nodeId}`,
    )

    await Promise.all([
      this.runExecutionLoop(registration.nodeId),
      this.runHeartbeatLoop(
        registration.nodeId,
        registration.heartbeatIntervalSeconds,
      ),
    ])
  }

  private async executeNextAvailableJob(nodeId: string): Promise<void> {
    const response = await this.executionJobClient.claimNextAvailable(nodeId)
    const executionJob = response.job
  
    if (!executionJob) {
      return
    }
  
    this.logger.log(
      `Executing job ${executionJob.id} (${executionJob.kind})`,
    )
  
    try {
      switch (executionJob.kind) {
        case 'system.test':
          await this.systemTestExecutor.execute(executionJob)
          break
  
        default:
          throw new Error(
            `Unsupported execution job kind: ${executionJob.kind}`,
          )
      }
  
      await this.executionJobClient.complete(
        executionJob.id,
      )
  
      this.logger.log(
        `Execution job ${executionJob.id} completed`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Execution failed with an unknown error'
  
      this.logger.error(
        `Execution job ${executionJob.id} failed: ${message}`,
        error instanceof Error
          ? error.stack
          : undefined,
      )
  
      await this.executionJobClient.fail(executionJob.id)
    }
  }

  private async runExecutionLoop(
    nodeId: string,
  ): Promise<void> {
    while (!this.abortController.signal.aborted) {
      try {
        await this.executeNextAvailableJob(nodeId)
      } catch (error) {
        this.logger.error(
          'Failed to execute the next available job',
          error instanceof Error
            ? error.stack
            : undefined,
        )
      }
  
      await this.wait(
        this.configuration.pollingIntervalMilliseconds,
      )
    }
  }

  private async runHeartbeatLoop(nodeId: string, intervalSeconds: number): Promise<void> {
    while (!this.abortController.signal.aborted) {
      try {        
        await this.executionNodeClient.heartbeat(nodeId)
      } catch (error) {
        this.logger.error(
          `Failed to send heartbeat for node ${nodeId}`,
          error instanceof Error
            ? error.stack
            : undefined,
        )
      }
  
      await this.wait(
        intervalSeconds * 1_000,
      )
    }
  }

  private async wait(
    milliseconds: number,
  ): Promise<void> {
    try {
      await this.waitForNextPoll()
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        return
      }
  
      throw error
    }
  }

  private async waitForNextPoll(): Promise<void> {
    try {
      await delay(this.configuration.pollingIntervalMilliseconds, undefined, {
        signal: this.abortController.signal,
      })
    } catch (error) {
      if (!this.abortController.signal.aborted) {
        throw error
      }
    }
  }
}
