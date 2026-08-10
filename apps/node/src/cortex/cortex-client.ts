// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Session, type RequestBuilderOptions } from '@cortex/networking'
import { Inject, Injectable } from '@nestjs/common'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../configuration/node-configuration'
import { CortexRequest } from './cortex-request'

/**
 * Options accepted by {@link CortexClient.request}.
 *
 * Base URL comes from {@link NodeConfiguration}; callers supply a relative path
 * plus method, parameters, body, and signal.
 */
export type CortexRequestOptions = Omit<RequestBuilderOptions, 'headers'>

/**
 * HTTP client for the Cortex control-plane API.
 *
 * Owns the API base URL and shared {@link Session}. Resources such as
 * {@link CortexExecutionJobResource} and {@link CortexNodeResource} call
 * {@link request} with relative paths, then {@link CortexRequest.response} or
 * {@link CortexRequest.responseJson}.
 */
@Injectable()
export class CortexClient {
  // MARK: - Properties

  private readonly baseUrl: string
  private readonly session = new Session()

  // MARK: - Constructor

  /**
   * Creates a client bound to the Node’s configured Cortex API URL.
   *
   * @param configuration - Host configuration providing the API base URL.
   */
  constructor(
    @Inject(NODE_CONFIGURATION)
    configuration: NodeConfiguration,
  ) {
    this.baseUrl = configuration.apiBaseURL.replace(/\/+$/, '')
  }

  // MARK: - Instance methods

  /**
   * Starts a relative Cortex API request.
   *
   * Applies the configured base URL, `Accept` header, and response validation.
   * Chain {@link CortexRequest.response} or {@link CortexRequest.responseJson}
   * to execute.
   *
   * @param path - Relative Cortex API path (for example `/internal/nodes/…/heartbeat`).
   * @param options - Method, parameters, encoder, body, and abort signal.
   * @returns A {@link CortexRequest} ready to decode the response.
   */
  request(path: string, options: CortexRequestOptions = {}): CortexRequest {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    return new CortexRequest(
      this.session
        .request(`${this.baseUrl}${normalizedPath}`, {
          ...options,
          headers: {
            Accept: 'application/json',
          },
        })
        .validate(),
    )
  }
}
