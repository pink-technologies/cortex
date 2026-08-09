// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  dispatchGitHubWebhook,
  signGitHubWebhookPayload,
  verifyGitHubWebhookSignature,
} from '../../../src/webhooks/github'

describe('verifyGitHubWebhookSignature', () => {
  const secret = 'test-secret'
  const rawBody = Buffer.from('{"ok":true}', 'utf8')

  it('accepts a valid sha256 signature', () => {
    const signature = signGitHubWebhookPayload(rawBody, secret)

    expect(verifyGitHubWebhookSignature(rawBody, signature, secret)).toBe(true)
  })

  it('rejects a missing or malformed signature header', () => {
    expect(verifyGitHubWebhookSignature(rawBody, undefined, secret)).toBe(false)
    expect(verifyGitHubWebhookSignature(rawBody, 'sha1=abc', secret)).toBe(false)
  })

  it('rejects an incorrect signature', () => {
    expect(verifyGitHubWebhookSignature(rawBody, 'sha256=deadbeef', secret)).toBe(false)
  })
})

describe('dispatchGitHubWebhook', () => {
  const pullRequestBody = {
    action: 'opened',
    pull_request: {
      base: { ref: 'main' },
      draft: false,
      head: { ref: 'feature/webhook', sha: 'abc123' },
      number: 42,
    },
    repository: {
      clone_url: 'https://github.com/pink-tech/cortex.git',
      name: 'cortex',
      owner: { login: 'pink-tech' },
    },
  }

  it('ignores ping events', () => {
    expect(
      dispatchGitHubWebhook({
        body: {},
        connectionId: 'github-main',
        deliveryId: undefined,
        event: 'ping',
      }),
    ).toEqual({
      kind: 'ignore',
      reason: 'ping',
    })
  })

  it('maps pull_request opened to a review enqueue', () => {
    const result = dispatchGitHubWebhook({
      body: pullRequestBody,
      connectionId: 'github-main',
      deliveryId: 'delivery-1',
      event: 'pull_request',
      instructions: 'Be thorough.',
    })

    expect(result).toEqual({
      kind: 'enqueue',
      definitionKey: 'repository.review.flow',
      payload: {
        change: {
          baseRef: 'main',
          headRef: 'feature/webhook',
          pullRequestNumber: 42,
        },
        connectionId: 'github-main',
        instructions: 'Be thorough.',
        repository: {
          cloneUrl: 'https://github.com/pink-tech/cortex.git',
          name: 'cortex',
          owner: 'pink-tech',
        },
        reviewMode: 'diff',
      },
      triggerIdentifier: 'github:pull_request:pink-tech/cortex:42:abc123',
    })
  })

  it('ignores draft pull requests until ready_for_review', () => {
    const draftBody = {
      ...pullRequestBody,
      action: 'opened',
      pull_request: {
        ...pullRequestBody.pull_request,
        draft: true,
      },
    }

    expect(
      dispatchGitHubWebhook({
        body: draftBody,
        connectionId: 'github-main',
        deliveryId: undefined,
        event: 'pull_request',
      }),
    ).toEqual({
      kind: 'ignore',
      reason: 'draft_pull_request',
    })

    const readyBody = {
      ...draftBody,
      action: 'ready_for_review',
    }

    expect(
      dispatchGitHubWebhook({
        body: readyBody,
        connectionId: 'github-main',
        deliveryId: undefined,
        event: 'pull_request',
      }),
    ).toMatchObject({
      kind: 'enqueue',
    })
  })

  it('ignores unsupported pull_request actions', () => {
    expect(
      dispatchGitHubWebhook({
        body: { ...pullRequestBody, action: 'closed' },
        connectionId: 'github-main',
        deliveryId: undefined,
        event: 'pull_request',
      }),
    ).toEqual({
      kind: 'ignore',
      reason: 'unsupported_action:closed',
    })
  })

  it('ignores missing events', () => {
    expect(
      dispatchGitHubWebhook({
        body: {},
        connectionId: 'github-main',
        deliveryId: undefined,
        event: undefined,
      }),
    ).toEqual({
      kind: 'ignore',
      reason: 'missing_event',
    })
  })

  it('ignores unsupported events', () => {
    expect(
      dispatchGitHubWebhook({
        body: {},
        connectionId: 'github-main',
        deliveryId: undefined,
        event: 'push',
      }),
    ).toEqual({
      kind: 'ignore',
      reason: 'unsupported_event:push',
    })
  })
})
