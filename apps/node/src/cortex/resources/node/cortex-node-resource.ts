// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod, JSONParameterEncoder } from '@cortex/networking'
import { Injectable } from '@nestjs/common'
import { CortexClient } from '../../cortex-client'
import { CortexNodeHeartbeatError, CortexNodeRegisterError } from './error/error'
import {
  RegisterNodeRequestSchema,
  RegisterNodeResponseSchema,
  type RegisterNodeRequest,
  type RegisterNodeResponse,
} from '@cortex/protocol'

/**
 * Cortex API resource for node registration and heartbeat.
 *
 * Paths are `/internal/nodes/...` relative to the configured API base URL.
 *
 * Registers the Node and sends heartbeats. Transport is provided by the
 * injected {@link CortexClient}.
 */
@Injectable()
export class CortexNodeResource {
  // MARK: - Properties

  private readonly client: CortexClient

  // MARK: - Constructor

  /**
   * Creates a node resource bound to a Cortex API client.
   *
   * @param client - Client for the Node’s configured Cortex API base URL.
   */
  constructor(client: CortexClient) {
    this.client = client
  }

  // MARK: - Instance methods

  /**
   * Sends a heartbeat for a registered Node.
   *
   * @param nodeId - Identifier of the Node sending the heartbeat.
   * @param signal - Optional signal used to cancel the in-flight request.
   * @throws {@link CortexNodeHeartbeatError} when the heartbeat request fails.
   */
  async heartbeat(nodeId: string, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted()

    try {
      await this.client
        .request(`/internal/nodes/${encodeURIComponent(nodeId)}/heartbeat`, {
          method: HTTPMethod.POST,
          signal,
        })
        .response()
    } catch (error) {
      if (signal?.aborted) {
        throw error
      }

      throw new CortexNodeHeartbeatError(nodeId, { cause: error })
    }
  }

  /**
   * Registers this Node with the Cortex API.
   *
   * @param request - Registration payload.
   * @param signal - Optional signal used to cancel the in-flight request.
   * @returns Validated registration response.
   * @throws {@link CortexNodeRegisterError} when registration fails.
   */
  async register(request: RegisterNodeRequest, signal?: AbortSignal): Promise<RegisterNodeResponse> {
    signal?.throwIfAborted()

    try {
      const parameters = RegisterNodeRequestSchema.parse(request)
      const body = await this.client
        .request('/internal/nodes/register', {
          method: HTTPMethod.POST,
          parameterEncoder: JSONParameterEncoder.default,
          parameters: parameters,
          signal,
        })
        .responseJson<unknown>()

      return RegisterNodeResponseSchema.parse(body)
    } catch (error) {
      if (signal?.aborted) {
        throw error
      }

      throw new CortexNodeRegisterError({ cause: error })
    }
  }
}
