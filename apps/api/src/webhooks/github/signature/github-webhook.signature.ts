// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verifies a GitHub webhook HMAC signature (`X-Hub-Signature-256`).
 *
 * Compares the hex digest of `HMAC-SHA256(secret, rawBody)` with the value
 * after the `sha256=` prefix using a constant-time equality check.
 *
 * @param rawBody - Exact request body bytes GitHub signed.
 * @param signatureHeader - Value of the `X-Hub-Signature-256` header.
 * @param secret - Shared webhook secret configured in GitHub and Cortex.
 * @returns `true` when the signature is present and valid.
 */
export function verifyGitHubWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) {
    return false
  }

  const receivedHex = signatureHeader.slice('sha256='.length)
  const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex')

  const received = Buffer.from(receivedHex, 'utf8')
  const expected = Buffer.from(expectedHex, 'utf8')

  if (received.length !== expected.length) {
    return false
  }

  return timingSafeEqual(received, expected)
}

/**
 * Builds a GitHub `X-Hub-Signature-256` header value for tests.
 *
 * @param rawBody - Request body bytes to sign.
 * @param secret - Shared webhook secret.
 * @returns Header value including the `sha256=` prefix.
 */
export function signGitHubWebhookPayload(rawBody: Buffer, secret: string): string {
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex')
  return `sha256=${digest}`
}
