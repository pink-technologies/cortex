// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../configuration/node-configuration'
import {
  ClaimExecutionJobResultSchema,
  type ClaimExecutionJobRequest,
  type ClaimExecutionJobResult,
} from '@cortex/protocol'

@Injectable()
export class ExecutionJobClient {
  // MARK: - Constructor

  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
  ) {}

  // MARK: - Instance Methods

  async claimNextAvailable(
    request: ClaimExecutionJobRequest,
  ): Promise<ClaimExecutionJobResult> {
    const response = await fetch(
      `${this.configuration.apiURL}/execution-jobs/claim`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    )

    await this.assertSuccessfulResponse(response)

    const body: unknown = await response.json()

    return ClaimExecutionJobResultSchema.parse(body)
  }

  async complete(id: string): Promise<void> {
    const response = await fetch(
      `${this.configuration.apiURL}/execution-jobs/${id}/complete`,
      {
        method: 'POST',
      },
    )

    await this.assertSuccessfulResponse(response)
  }

  async fail(id: string): Promise<void> {
    const response = await fetch(
      `${this.configuration.apiURL}/execution-jobs/${id}/fail`,
      {
        method: 'POST',
      },
    )

    await this.assertSuccessfulResponse(response)
  }

  // MARK: - Private Methods

  private async assertSuccessfulResponse(response: Response): Promise<void> {
    if (response.ok) {
      return
    }

    const body = await response.text()

    throw new Error(
      `Cortex API request failed with status ${response.status}: ${body}`,
    )
  }
}
