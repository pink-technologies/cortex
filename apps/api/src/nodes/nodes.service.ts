// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { NODES_REPOSITORY, type NodesRepository } from './repository/nodes.repository'
import { ExecutionNode, NodeState } from './models/execution-node'
import { RegisterNodeParameters } from './parameters/register/register-node-parameters'
import { NodeDisabledError, NodeNotFoundError, NodeRevokedError } from './error/error'

/**
 * Coordinates execution-node registration, lookup, heartbeat, and scheduling
 * eligibility.
 *
 * The service applies node lifecycle rules before delegating persistence to
 * {@link NodesRepository}. Callers receive domain-specific errors instead of
 * nullable lookup results or persistence details.
 */
@Injectable()
export class NodesService {
  // MARK: - Constructor

  /**
   * Creates the execution-node service.
   *
   * @param nodesRepository - Persistence port for node registrations and
   *   heartbeat updates.
   */
  constructor(
    @Inject(NODES_REPOSITORY)
    private readonly nodesRepository: NodesRepository,
  ) {
    this.nodesRepository = nodesRepository
  }

  // MARK: - Instance methods

  /**
   * Retrieves a registered node by its server-assigned identifier.
   *
   * @param id - Stable node identifier.
   * @returns The matching execution node.
   * @throws {NodeNotFoundError} When no node exists for the identifier.
   */
  async find(id: string): Promise<ExecutionNode> {
    const existingNode = await this.nodesRepository.find(id)

    if (!existingNode) {
      throw new NodeNotFoundError(id)
    }

    return existingNode
  }

  /**
   * Retrieves the node registered to an installation.
   *
   * @param installationId - Stable installation identifier reported by the node.
   * @returns The matching execution node.
   * @throws {NodeNotFoundError} When the installation has no registered node.
   */
  async findByInstallationId(installationId: string): Promise<ExecutionNode> {
    const existingNode = await this.nodesRepository.findByInstallationId(installationId)

    if (!existingNode) {
      throw new NodeNotFoundError(installationId)
    }

    return existingNode
  }

  /**
   * Records activity for an existing node.
   *
   * Revoked nodes cannot renew their heartbeat.
   *
   * @param id - Stable identifier of the node reporting activity.
   * @throws {NodeNotFoundError} When the node does not exist or cannot be updated.
   * @throws {NodeRevokedError} When the node registration has been revoked.
   */
  async heartbeat(id: string): Promise<void> {
    const existingNode = await this.nodesRepository.find(id)

    if (existingNode?.state === NodeState.REVOKED) {
      throw new NodeRevokedError(id)
    }

    const updated = this.nodesRepository.heartbeat(id)

    if (!updated) {
      throw new NodeNotFoundError(id)
    }
  }

  /**
   * Registers a node or refreshes its existing installation registration.
   *
   * Missing installations are created. Revoked installations remain revoked and
   * cannot be registered again.
   *
   * @param parameters - Current node identity, host metadata, capabilities,
   *   and supported execution kinds.
   * @returns The persisted execution node.
   * @throws {NodeRevokedError} When the existing or persisted registration is
   *   revoked.
   */
  async register(parameters: RegisterNodeParameters): Promise<ExecutionNode> {
    const existingNode = await this.nodesRepository.findByInstallationId(parameters.installationId)

    if (existingNode?.state === NodeState.REVOKED) {
      throw new NodeRevokedError(parameters.installationId)
    }

    const executionNode = await this.nodesRepository.register(parameters)

    if (executionNode.state === NodeState.REVOKED) {
      throw new NodeRevokedError(parameters.installationId)
    }

    return executionNode
  }

  /**
   * Resolves a node that is eligible to receive execution work.
   *
   * Only nodes in the {@link NodeState.ENABLED} state are returned.
   *
   * @param id - Stable node identifier.
   * @returns The enabled execution node.
   * @throws {NodeNotFoundError} When the node does not exist.
   * @throws {NodeDisabledError} When scheduling is disabled for the node.
   * @throws {NodeRevokedError} When the node registration has been revoked.
   */
  async resolveForExecution(id: string): Promise<ExecutionNode> {
    const existingNode = await this.find(id)

    if (!existingNode) {
      throw new NodeNotFoundError(id)
    }

    switch (existingNode.state) {
      case NodeState.ENABLED:
        return existingNode

      case NodeState.DISABLED:
        throw new NodeDisabledError(id)

      case NodeState.REVOKED:
        throw new NodeRevokedError(id)
    }
  }
}