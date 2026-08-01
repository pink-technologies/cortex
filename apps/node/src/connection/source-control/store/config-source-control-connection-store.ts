// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../../../configuration'
import type { SourceControlConnection, SourceControlConnectionStore } from '../models'

/**
 * {@link SourceControlConnectionStore} backed by {@link NodeConfiguration}.
 */
@Injectable()
export class ConfigSourceControlConnectionStore implements SourceControlConnectionStore {
  // MARK: - Constructor

  /**
   * Creates a configuration-backed connection store.
   *
   * @param configuration - Node configuration providing source-control connections.
   */
  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
  ) {}

  // MARK: - Instance methods

  /**
   * Resolves a configured source-control connection.
   *
   * @param connectionId - Identifier from the job payload.
   * @returns The matching connection.
   * @throws When no connection is configured for the identifier.
   */
  resolve(connectionId: string): SourceControlConnection {
    const connection = this.configuration.sourceControlConnections.find((entry) => {
      return entry.id === connectionId
    })

    if (!connection) {
      throw new Error(
        `Source-control connection '${connectionId}' is not configured on this Node.`,
      )
    }

    return connection
  }
}
