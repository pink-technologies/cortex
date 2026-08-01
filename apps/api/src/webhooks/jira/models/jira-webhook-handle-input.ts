// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Inputs extracted from an inbound Jira webhook HTTP request.
 */
export interface JiraWebhookHandleInput {
  /**
   * Parsed JSON body from the HTTP request.
   */
  readonly body: unknown

  /**
   * Exact request body bytes signed for HMAC verification.
   */
  readonly rawBody: Buffer

  /**
   * Value of the `X-Hub-Signature-256` or `X-Hub-Signature` header, when present.
   */
  readonly signatureHeader: string | undefined
}
