// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { setTimeout as delay } from 'node:timers/promises'
import { Inject, Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common'
import { AgentRuntimeBootstrap } from '../agent/bootstrap'
import {
  assertJiraTriageRuntimeReady,
  assertRepositoryReviewRuntimeReady,
  NODE_CONFIGURATION,
  type NodeConfiguration,
} from '../configuration'
import { ExecutionJobPoller } from './jobs/polling'
import { CortexNodeResource } from '../cortex'
import { NodeDescriptorProvider } from '../node/node-descriptor.provider'
import { NodeIdentityStore } from '../node/node-identity-store'

/**
 * Application lifecycle coordinator for a Cortex execution Node.
 *
 * Started by Nest via {@link OnApplicationBootstrap} and stopped via
 * {@link OnApplicationShutdown}. On boot this service loads local agent
 * definitions, registers the Node with the Cortex API using a stable
 * installation identity and workload descriptor, then runs the execution-job
 * poller and heartbeat loop until shutdown aborts them.
 *
 * Responsibilities:
 * - initialize {@link AgentRuntimeBootstrap} before accepting work
 * - register with the control plane and log the assigned Node id
 * - run {@link ExecutionJobPoller} and periodic heartbeats concurrently
 * - abort in-flight loops cleanly on application shutdown
 *
 * Non-responsibilities:
 * - claiming, executing, or completing individual jobs (see
 *   {@link ExecutionJobPoller})
 * - HTTP transport details for registration or heartbeat (see
 *   {@link CortexNodeResource})
 * - constructing the advertised descriptor or persisting installation identity
 */
@Injectable()
export class ExecutionNodeService implements OnApplicationBootstrap, OnApplicationShutdown {
  // MARK: - Private Properties

  private readonly abortController = new AbortController()
  private readonly logger = new Logger(ExecutionNodeService.name)

  private executionTask: Promise<void> | undefined

  // MARK: - Constructor

  /**
   * Creates the execution Node service.
   *
   * @param configuration - Validated Cortex Node configuration.
   * @param agentRuntimeBootstrap - Initializes local agent definitions.
   * @param nodeDescriptorProvider - Creates the local Node descriptor.
   * @param identityStore - Stores the stable Node installation identity.
   * @param nodes - Resource for Node registration and heartbeats.
   * @param executionJobPoller - Claims and processes execution jobs.
   */
  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
    private readonly agentRuntimeBootstrap: AgentRuntimeBootstrap,
    private readonly nodeDescriptorProvider: NodeDescriptorProvider,
    private readonly identityStore: NodeIdentityStore,
    private readonly nodes: CortexNodeResource,
    private readonly executionJobPoller: ExecutionJobPoller,
  ) {}

  // MARK: - OnApplicationBootstrap

  onApplicationBootstrap(): void {
    if (this.executionTask) {
      return
    }

    this.executionTask = this.run(this.abortController.signal).catch((error) => {
      if (this.abortController.signal.aborted) {
        return
      }

      this.logger.error(
        'Cortex Node failed during startup or execution loop',
        error instanceof Error ? error.stack : undefined,
      )
      process.exit(1)
    })
  }

  // MARK: - OnApplicationShutdown

  async onApplicationShutdown(): Promise<void> {
    this.abortController.abort()

    await this.executionTask
  }

  // MARK: - Private methods

  private async run(signal: AbortSignal): Promise<void> {
    await this.agentRuntimeBootstrap.initialize()

    signal.throwIfAborted()

    const descriptor = this.nodeDescriptorProvider.create()

    assertRepositoryReviewRuntimeReady(this.configuration, descriptor.supportedKinds)
    assertJiraTriageRuntimeReady(this.configuration, descriptor.supportedKinds)

    const identity = await this.identityStore.loadOrCreate()
    const registration = await this.nodes.register({
      ...descriptor,
      installationId: identity.installationId,
      name: this.configuration.nodeName,
      version: this.configuration.version,
    })

    this.logger.log(`Cortex Node registered as ${registration.nodeId} (kinds: ${descriptor.supportedKinds.join(', ')})`)

    if (this.configuration.sourceControlConnections.length > 0) {
      this.logger.log(
        `Source-control connections ready: ${this.configuration.sourceControlConnections
          .map((connection) => connection.id)
          .join(', ')}`,
      )
    }

    await Promise.all([
      this.executionJobPoller.run(registration.nodeId, signal),
      this.runHeartbeatLoop(registration.nodeId, registration.heartbeatIntervalSeconds, signal),
    ])
  }

  private async runHeartbeatLoop(nodeId: string, intervalSeconds: number, signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      try {
        await this.nodes.heartbeat(nodeId, signal)
      } catch (error) {
        if (signal.aborted) {
          return
        }

        this.logger.error(
          `Failed to send heartbeat for Node '${nodeId}'.`,
          error instanceof Error ? error.stack : undefined,
        )
      }

      await this.wait(intervalSeconds * 1_000, signal)
    }
  }

  private async wait(milliseconds: number, signal: AbortSignal): Promise<void> {
    try {
      await delay(milliseconds, undefined, {
        signal,
      })
    } catch (error) {
      if (signal.aborted) {
        return
      }

      throw error
    }
  }
}
