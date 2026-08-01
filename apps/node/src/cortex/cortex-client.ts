// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Session, type RequestBuilderOptions } from '@cortex/networking'
import { Inject, Injectable } from '@nestjs/common'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../configuration/node-configuration'

/**
 * Options accepted by {@link CortexClient} request helpers.
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
 * {@link requestJson} / {@link request} with relative paths only.
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
    this.baseUrl = configuration.apiURL.replace(/\/+$/, '')
  }

  // MARK: - Instance methods

  /**
   * Executes a request that returns no useful JSON body.
   *
   * Used for complete / fail / heartbeat style endpoints. Responses are
   * validated; the body is discarded after a successful status.
   *
   * @param path - Relative Cortex API path (for example `/internal/nodes/…/heartbeat`).
   * @param options - Method, parameters, encoder, body, and abort signal.
   * @throws When validation or transport fails.
   */
  async request(path: string, options: CortexRequestOptions = {}): Promise<void> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const response = await this.session
      .request(`${this.baseUrl}${normalizedPath}`, {
        ...options,
        headers: {
          Accept: 'application/json',
        },
      })
      .validate()
      .serializingText()

    if (!response.result.ok) {
      throw response.result.error
    }
  }

  /**
   * Executes a request and decodes a JSON response body.
   *
   * @typeParam T - Expected JSON response shape.
   * @param path - Relative Cortex API path.
   * @param options - Method, parameters, encoder, body, and abort signal.
   * @returns Decoded JSON body as `T`.
   * @throws When validation or JSON deserialization fails.
   */
  async requestJson<T>(path: string, options: CortexRequestOptions = {}): Promise<T> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const response = await this.session
      .request(`${this.baseUrl}${normalizedPath}`, {
        ...options,
        headers: {
          Accept: 'application/json',
        },
      })
      .validate()
      .serializingJson<T>()

    if (!response.result.ok) {
      throw response.result.error
    }

    return response.result.value
  }
}
