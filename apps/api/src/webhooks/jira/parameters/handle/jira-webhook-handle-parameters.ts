// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Application-layer input for handling one Jira webhook delivery.
 *
 * Carries the values the controller extracts from the HTTP request before the
 * service verifies the signature and dispatches to a named route.
 */
export interface JiraWebhookHandleParameters {
  /**
   * Parsed JSON body from the HTTP request.
   */
  readonly body: unknown

  /**
   * Exact request body bytes signed for HMAC verification.
   */
  readonly rawBody: Buffer

  /**
   * Registry route name selected by the HTTP path.
   */
  readonly routeName: string

  /**
   * Value of the `X-Hub-Signature-256` or `X-Hub-Signature` header, when present.
   */
  readonly signatureHeader: string | undefined
}
