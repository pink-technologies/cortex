// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Session, type RequestBuilderOptions } from '@cortex/networking';

/**
 * Options accepted by {@link TrelloClient.request}.
 *
 * Auth (`key` / `token`) is applied by the client; callers supply a relative
 * path plus method, parameters, and signal.
 */
export type TrelloRequestOptions = Omit<RequestBuilderOptions, 'headers'>;

/**
 * Authenticated HTTP client for a single Trello credential pair.
 *
 * Owns the API base URL, query-param auth, and shared {@link Session}.
 * Resources such as {@link TrelloCardResource} call {@link request} with
 * relative API paths only.
 */
export class TrelloClient {
  // MARK: - Properties

  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.trello.com/1';
  private readonly session = new Session();
  private readonly token: string;

  // MARK: - Constructor

  /**
   * Creates a client bound to one Trello API key and token.
   *
   * @param apiKey - Trello API key.
   * @param token - Trello user token.
   */
  constructor(apiKey: string, token: string) {
    this.apiKey = apiKey;
    this.token = token;
  }

  // MARK: - Instance methods

  /**
   * Executes a request against a path under the Trello API and decodes JSON.
   *
   * `path` must be absolute from the API root (for example `/cards`). Auth
   * query parameters are merged with any caller `parameters`. Responses are
   * validated, then deserialized as `T`.
   *
   * @typeParam T - Expected JSON response shape.
   * @param path - Relative Trello REST path to execute.
   * @param options - Method, parameters, encoder, body, and abort signal.
   * @returns Decoded JSON body as `T`.
   * @throws When validation or JSON deserialization fails.
   */
  async request<T>(path: string, options: TrelloRequestOptions = {}): Promise<T> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const response = await this.session
      .request(`${this.baseUrl}${normalizedPath}`, {
        ...options,
        headers: {
          Accept: 'application/json',
        },
        parameters: {
          key: this.apiKey,
          token: this.token,
          ...options.parameters,
        },
      })
      .validate()
      .serializingJson<T>();

    if (!response.result.ok) {
      throw response.result.error;
    }

    return response.result.value;
  }
}
