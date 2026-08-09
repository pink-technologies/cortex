// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Application-layer input for handling one GitHub webhook delivery.
 *
 * Carries the values the controller extracts from the HTTP request before the
 * service verifies the signature and dispatches by `X-GitHub-Event`.
 */
export interface GitHubWebhookHandleParameters {
  /**
   * Parsed JSON body from the HTTP request.
   */
  readonly body: unknown

  /**
   * Value of the `X-GitHub-Delivery` header, when present.
   */
  readonly deliveryId: string | undefined

  /**
   * Value of the `X-GitHub-Event` header, when present.
   */
  readonly event: string | undefined

  /**
   * Exact request body bytes GitHub signed for HMAC verification.
   */
  readonly rawBody: Buffer

  /**
   * Value of the `X-Hub-Signature-256` header, when present.
   */
  readonly signatureHeader: string | undefined
}
