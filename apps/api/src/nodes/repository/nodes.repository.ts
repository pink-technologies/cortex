// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { Database } from '@/infraestructure/database'
import { ExecutionNode } from '../models/execution-node'
import { RegisterNodeParameters } from '../parameters/register/register-node-parameters'
import { FindNodeFailedError, HeartbeatNodeFailedError, RegisterNodeFailedError } from '../error/error'

/**
 * Injection token for the {@link NodesRepository} persistence port.
 *
 * Consumers should inject this token instead of depending directly on
 * {@link NodesRepositoryImpl}.
 */
export const NODES_REPOSITORY = Symbol('NODES_REPOSITORY')

/**
 * Persistence operations for registered Cortex execution nodes.
 *
 * Implementations isolate callers from the database representation and return
 * domain-level {@link ExecutionNode} instances.
 */
export interface NodesRepository {
  /**
   * Finds a node by its server-assigned identifier.
   *
   * @param id - Stable node identifier.
   * @returns The matching node, or `null` when it does not exist.
   */
  find(id: string): Promise<ExecutionNode | null>

  /**
   * Finds the node associated with an installation.
   *
   * @param installationId - Stable installation identifier reported by the node.
   * @returns The matching node, or `null` when the installation is not registered.
   */
  findByInstallationId(installationId: string): Promise<ExecutionNode | null>

  /**
   * Records that a node is still active by refreshing its last-seen timestamp.
   *
   * @param id - Stable identifier of the node sending the heartbeat.
   * @returns `true` when the heartbeat is recorded; otherwise `false`.
   */
  heartbeat(id: string): Promise<boolean>

  /**
   * Creates or refreshes a node registration for an installation.
   *
   * @param parameters - Current node identity, host metadata, capabilities,
   *   and supported job kinds.
   * @returns The persisted node.
   */
  register(parameters: RegisterNodeParameters): Promise<ExecutionNode>
}

/**
 * Prisma-backed implementation of {@link NodesRepository}.
 *
 * Persistence records are converted to domain objects through
 * {@link ExecutionNodeMapper}. Database failures are wrapped in node-module
 * errors so callers do not depend on Prisma-specific exceptions.
 */
@Injectable()
export class NodesRepositoryImpl implements NodesRepository {
  // MARK: - Constructor

  /**
   * Creates a node repository.
   *
   * @param database - Application database client used to query and persist
   *   node registrations.
   */
  constructor(private readonly database: Database) {}

  // MARK: - NodesRepository

  /**
   * Finds a node by its server-assigned identifier.
   *
   * @param id - Stable node identifier.
   * @returns The mapped node, or `null` when no record matches.
   * @throws {FindNodeFailedError} When the database lookup fails.
   */
  async find(id: string): Promise<ExecutionNode | null> {
    try {
      const node = await this.database.executionNode.findUnique({
        where: {
          id,
        },
      })

      if (!node) {
        return null
      }

      return ExecutionNode.from(node)
    } catch (error) {
      throw new FindNodeFailedError('Failed to find node by id: ${id}', { cause: error })
    }
  }

  /**
   * Finds the node registered to an installation.
   *
   * @param installationId - Stable installation identifier.
   * @returns The mapped node, or `null` when the installation is not registered.
   * @throws {FindNodeFailedError} When the database lookup fails.
   */
  async findByInstallationId(installationId: string): Promise<ExecutionNode | null> {
    try {
      const node = await this.database.executionNode.findFirst({
        where: {
          installationId,
        },
      })

      if (!node) {
        return null
      }

      return ExecutionNode.from(node)
    } catch (error) {
      throw new FindNodeFailedError('Failed to find node by installation id: ${installationId}', { cause: error })
    }
  }

  /**
   * Refreshes the node's `lastSeenAt` timestamp.
   *
   * @param id - Stable identifier of the active node.
   * @returns `true` when the heartbeat is recorded; otherwise `false`.
   * @throws {HeartbeatNodeFailedError} When the timestamp cannot be updated.
   */
  async heartbeat(id: string): Promise<boolean> {
    try {
      const now = new Date()
      const result = await this.database.executionNode.update({
        where: {
          id,
        },
        data: {
          lastSeenAt: now,
        },
      })

      return result === null
    } catch (error) {
      throw new HeartbeatNodeFailedError('Failed to heartbeat node: ${id}', { cause: error })
    }
  }

  /**
   * Upserts a node by installation identifier.
   *
   * Existing registrations receive the latest host metadata, capabilities,
   * supported job kinds, version, and heartbeat timestamp. New installations
   * receive a server-generated node identifier.
   *
   * @param parameters - Node registration metadata.
   * @returns The newly created or refreshed node.
   * @throws {RegisterNodeFailedError} When the registration cannot be persisted.
   */
  async register(parameters: RegisterNodeParameters): Promise<ExecutionNode> {
    try {
      const now = new Date()
      const node = await this.database.executionNode.upsert({
        where: {
          installationId: parameters.installationId,
        },
        create: {
          architecture: parameters.architecture,
          capabilities: [...parameters.capabilities],
          installationId: parameters.installationId,
          labels: [...parameters.labels],
          lastSeenAt: now,
          name: parameters.name,
          operatingSystem: parameters.operatingSystem,
          supportedKinds: [...parameters.supportedKinds],
          version: parameters.version,
        },
        update: {
          architecture: parameters.architecture,
          capabilities: [...parameters.capabilities],
          labels: [...parameters.labels],
          lastSeenAt: now,
          name: parameters.name,
          operatingSystem: parameters.operatingSystem,
          supportedKinds: [...parameters.supportedKinds],
          version: parameters.version,
        },
      })

      return ExecutionNode.from(node)
    } catch (error) {
      throw new RegisterNodeFailedError('Failed to register node: ${parameters.installationId}', { cause: error })
    }
  }
}
