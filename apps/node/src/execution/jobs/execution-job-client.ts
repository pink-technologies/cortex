// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '@cortex/networking'
import { Inject, Injectable } from '@nestjs/common'
import {
  CompleteExecutionJobRequestSchema,
  ClaimExecutionJobRequestSchema,
  ClaimExecutionJobResponseSchema,
  type ClaimExecutionJobResponse,
  FailExecutionJobRequest,
  FailExecutionJobRequestSchema,
  CompleteExecutionJobRequest,
} from '@cortex/protocol'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../../configuration/node-configuration'

/**
 * HTTP client for Cortex API execution-job endpoints.
 *
 * This is the Node's outbound boundary to the control plane: it claims work,
 * reports successful completion, and reports failures. Request and response
 * bodies are validated with `@cortex/protocol` schemas so malformed API
 * payloads fail closed before they reach job workers.
 *
 * Responsibilities:
 * - POST claim / complete / fail against the configured Cortex API base URL
 * - validate claim request and response shapes with protocol schemas
 * - surface non-success HTTP responses as errors with status and body text
 * - honor optional {@link AbortSignal} cancellation on every request
 *
 * Non-responsibilities:
 * - polling cadence or backoff (see the execution-job poller)
 * - executing claimed jobs or invoking the agent runtime
 * - authentication beyond what the host HTTP stack already provides
 */
@Injectable()
export class ExecutionJobClient {
  // MARK: - Constructor

  /**
   * Creates an execution-job client for the Cortex Node.
   *
   * @param configuration - Host configuration providing the Cortex API base URL.
   */
  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
  ) {}

  // MARK: - Instance methods

  /**
   * Claims the next execution job available to this Node, if any.
   *
   * Sends a validated {@link ClaimExecutionJobRequestSchema} payload and
   * returns a response parsed with {@link ClaimExecutionJobResponseSchema}.
   * An empty claim (no job ready) is a successful response — callers decide
   * how to wait before claiming again.
   *
   * @param nodeId - Stable identifier of the claiming Node.
   * @param signal - Optional signal used to cancel the in-flight request.
   * @returns The validated claim response from the Cortex API.
   * @throws When the request body fails schema validation, the HTTP response
   *   is not successful, or the response body fails schema validation.
   */
  async claimNextAvailable(nodeId: string, signal?: AbortSignal): Promise<ClaimExecutionJobResponse> {
    const request = ClaimExecutionJobRequestSchema.parse({
      nodeId,
    })

    const response = await fetch(`${this.configuration.apiURL}/internal/execution-jobs/claim`, {
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
      method: HTTPMethod.POST,
      signal,
    })

    await this.assertSuccessfulResponse(response)

    const body: unknown = await response.json()

    return ClaimExecutionJobResponseSchema.parse(body)
  }

  /**
   * Marks an execution job as completed on the Cortex API.
   *
   * Call after the Node has finished processing the claimed job successfully.
   * Does not send a response body; only the HTTP status is checked.
   *
   * @param id - Identifier of the execution job to complete.
   * @param request - The request containing the information to complete the job.
   * @param signal - Optional signal used to cancel the in-flight request.
   * @throws When the Cortex API returns a non-success status.
   */
  async complete(id: string, request: CompleteExecutionJobRequest, signal?: AbortSignal): Promise<void> {    
    const body = CompleteExecutionJobRequestSchema.parse(request)
    const response = await fetch(`${this.configuration.apiURL}/internal/execution-jobs/${id}/complete`, {
      method: HTTPMethod.POST,
      body: JSON.stringify(body),
      signal,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    await this.assertSuccessfulResponse(response)
  }

  /**
   * Marks an execution job as failed on the Cortex API.
   *
   * Call when job processing throws or otherwise cannot complete successfully.
   * Does not send a response body; only the HTTP status is checked.
   *
   * @param id - Identifier of the execution job to fail.
   * @param request - The request containing the information
   * @param signal - Optional signal used to cancel the in-flight request.
   * @throws When the Cortex API returns a non-success status.
   */
  async fail(id: string, request: FailExecutionJobRequest, signal?: AbortSignal): Promise<void> {
    const body = FailExecutionJobRequestSchema.parse(request)
    const response = await fetch(
      `${this.configuration.apiURL}/internal/execution-jobs/${id}/fail`, 
      {
        body: JSON.stringify(body),
        method: HTTPMethod.POST,
        signal,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    await this.assertSuccessfulResponse(response)
  }

  // MARK: - Private methods

  private async assertSuccessfulResponse(response: Response): Promise<void> {
    if (response.ok) {
      return
    }

    const body = await response.text()

    throw new Error(`Cortex API request failed with status ${response.status}: ${body}`)
  }
}
