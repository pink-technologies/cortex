// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod, JSONParameterEncoder } from '@cortex/networking'
import { Injectable } from '@nestjs/common'
import {
  ClaimExecutionJobRequestSchema,
  ClaimExecutionJobResponseSchema,
  CompleteExecutionJobRequestSchema,
  FailExecutionJobRequestSchema,
  type ClaimExecutionJobResponse,
  type CompleteExecutionJobRequest,
  type FailExecutionJobRequest,
} from '@cortex/protocol'
import { CortexClient } from '../../cortex-client'
import {
  CortexExecutionJobClaimError,
  CortexExecutionJobCompleteError,
  CortexExecutionJobFailError,
} from './error/error'

/**
 * Cortex API resource for `/internal/execution-jobs` paths.
 *
 * Claims work and reports terminal job outcomes. Transport is provided by the
 * injected {@link CortexClient}. Request/response bodies are validated with
 * `@cortex/protocol` schemas.
 */
@Injectable()
export class CortexExecutionJobResource {
  // MARK: - Properties

  private readonly client: CortexClient

  // MARK: - Constructor

  /**
   * Creates an execution-job resource bound to a Cortex API client.
   *
   * @param client - Client for the Node’s configured Cortex API base URL.
   */
  constructor(client: CortexClient) {
    this.client = client
  }

  // MARK: - Instance methods

  /**
   * Claims the next execution job available to this Node, if any.
   *
   * @param nodeId - Stable identifier of the claiming Node.
   * @param signal - Optional signal used to cancel the in-flight request.
   * @returns The validated claim response from the Cortex API.
   * @throws {@link CortexExecutionJobClaimError} when the claim request fails.
   */
  async claimNextAvailable(nodeId: string, signal?: AbortSignal): Promise<ClaimExecutionJobResponse> {
    signal?.throwIfAborted()

    try {
      const request = ClaimExecutionJobRequestSchema.parse({ nodeId })
      const body = await this.client.requestJson<unknown>('/internal/execution-jobs/claim', {
        method: HTTPMethod.POST,
        parameterEncoder: JSONParameterEncoder.default,
        parameters: request,
        signal,
      })

      return ClaimExecutionJobResponseSchema.parse(body)
    } catch (error) {
      if (signal?.aborted) {
        throw error
      }

      throw new CortexExecutionJobClaimError(nodeId, { cause: error })
    }
  }

  /**
   * Marks an execution job as completed on the Cortex API.
   *
   * @param id - Identifier of the execution job to complete.
   * @param request - Completion payload validated by protocol schemas.
   * @param signal - Optional signal used to cancel the in-flight request.
   * @throws {@link CortexExecutionJobCompleteError} when the complete request fails.
   */
  async complete(id: string, request: CompleteExecutionJobRequest, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted()

    try {
      const body = CompleteExecutionJobRequestSchema.parse(request)

      await this.client.request(`/internal/execution-jobs/${encodeURIComponent(id)}/complete`, {
        method: HTTPMethod.POST,
        parameterEncoder: JSONParameterEncoder.default,
        parameters: body,
        signal,
      })
    } catch (error) {
      if (signal?.aborted) {
        throw error
      }

      throw new CortexExecutionJobCompleteError(id, { cause: error })
    }
  }

  /**
   * Marks an execution job as failed on the Cortex API.
   *
   * @param id - Identifier of the execution job to fail.
   * @param request - Failure payload validated by protocol schemas.
   * @param signal - Optional signal used to cancel the in-flight request.
   * @throws {@link CortexExecutionJobFailError} when the fail request fails.
   */
  async fail(id: string, request: FailExecutionJobRequest, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted()

    try {
      const body = FailExecutionJobRequestSchema.parse(request)

      await this.client.request(`/internal/execution-jobs/${encodeURIComponent(id)}/fail`, {
        method: HTTPMethod.POST,
        parameterEncoder: JSONParameterEncoder.default,
        parameters: body,
        signal,
      })
    } catch (error) {
      if (signal?.aborted) {
        throw error
      }

      throw new CortexExecutionJobFailError(id, { cause: error })
    }
  }
}
