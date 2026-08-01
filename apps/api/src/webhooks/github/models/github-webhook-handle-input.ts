// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Inputs extracted from an inbound GitHub webhook HTTP request.
 */
export interface GitHubWebhookHandleInput {
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
