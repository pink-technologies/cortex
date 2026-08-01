// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '@cortex/networking'
import { Injectable, Inject } from '@nestjs/common'
import {
  RegisterNodeRequest,
  RegisterNodeResponse,
  RegisterNodeResponseSchema,
} from '@cortex/protocol'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../configuration/node-configuration'

/**
 * HTTP client for registering this Node with the Cortex API.
 */
@Injectable()
export class ExecutionNodeClient {
  // MARK: - Constructor

  /**
   * Creates a Cortex API client for Node registration.
   *
   * @param configuration - Node configuration providing the API base URL.
   */
  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration:
      NodeConfiguration,
  ) {}

  // MARK: - Instance Methods

  async register(request: RegisterNodeRequest): Promise<RegisterNodeResponse> {    
    const response = await fetch(
      `${this.configuration.apiURL}/internal/nodes/register`,
      {
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json',
        },
        method: HTTPMethod.POST,
      },
    )

    if (!response.ok) {
      throw new Error(
        `Failed to register Cortex Node: ${response.status}`,
      )
    }

    return RegisterNodeResponseSchema.parse(
      await response.json(),
    )
  }

  async heartbeat(nodeId: string, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted()

    const response = await fetch(
      `${this.configuration.apiURL}/internal/nodes/${nodeId}/heartbeat`,
      {
        method: HTTPMethod.POST,
      },
    )

    signal?.throwIfAborted()

    if (!response.ok) {
      throw new Error(
        `Failed to send Cortex Node heartbeat: ${response.status}`,
      )
    }
  }
}