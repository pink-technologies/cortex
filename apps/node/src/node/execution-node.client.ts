// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common"
import { RegisterNodeRequest } from "@cortex/protocol"
import { RegisterNodeResponse } from "@cortex/protocol"
import { RegisterNodeResponseSchema } from "@cortex/protocol"
import { Inject } from "@nestjs/common"
import { NODE_CONFIGURATION, type NodeConfiguration } from "../configuration/node-configuration"

@Injectable()
export class ExecutionNodeClient {
  // MARK: - Constructor

  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration:
      NodeConfiguration,
  ) {}

  // MARK: - Instance Methods

  async register(
    request: RegisterNodeRequest,
  ): Promise<RegisterNodeResponse> {    
    const response = await fetch(
      `${this.configuration.apiURL}/internal/nodes/register`,
      {
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
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

  async heartbeat(nodeId: string): Promise<void> {
    const response = await fetch(
      `${this.configuration.apiURL}/internal/nodes/${nodeId}/heartbeat`,
      {
        method: 'POST',
      },
    )

    if (!response.ok) {
      throw new Error(
        `Failed to send Cortex Node heartbeat: ${response.status}`,
      )
    }
  }
}