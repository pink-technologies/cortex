// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../../../configuration'
import type { JiraConnection, JiraConnectionStore } from '../models'

/**
 * {@link JiraConnectionStore} backed by {@link NodeConfiguration}.
 */
@Injectable()
export class ConfigJiraConnectionStore implements JiraConnectionStore {
  // MARK: - Constructor

  /**
   * Creates a configuration-backed Jira connection store.
   *
   * @param configuration - Node configuration providing Jira connections.
   */
  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
  ) {}

  // MARK: - Instance methods

  /**
   * Resolves a configured Jira connection.
   *
   * @param connectionId - Identifier from the job payload.
   * @returns The matching connection.
   * @throws When no connection is configured for the identifier.
   */
  resolve(connectionId: string): JiraConnection {
    const connection = this.configuration.jiraConnections.find((entry) => {
      return entry.id === connectionId
    })

    if (!connection) {
      throw new Error(`Jira connection '${connectionId}' is not configured on this Node.`)
    }

    return connection
  }
}
