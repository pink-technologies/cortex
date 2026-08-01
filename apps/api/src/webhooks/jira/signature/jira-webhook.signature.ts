// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verifies a Jira webhook HMAC signature when Cortex is configured with a
 * shared secret (`X-Hub-Signature` style `sha256=` digest, same family as
 * GitHub).
 *
 * Atlassian cloud webhooks may also use JWT; for MVP we accept a shared-secret
 * HMAC over the raw body when `JIRA_WEBHOOK_SECRET` is set.
 */
export function verifyJiraWebhookSignature(
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
 * Builds a test signature header for Jira webhook unit tests.
 */
export function signJiraWebhookPayload(rawBody: Buffer, secret: string): string {
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex')
  return `sha256=${digest}`
}
