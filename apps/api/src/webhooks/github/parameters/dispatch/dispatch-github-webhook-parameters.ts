// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Application-layer input for dispatching one verified GitHub webhook delivery.
 *
 * Carries delivery fields plus connection defaults after signature verification.
 * {@link dispatchGitHubWebhook} matches registered routes by event and produces
 * a {@link GitHubWebhookDecision}.
 */
export interface DispatchGitHubWebhookParameters {
  /**
   * Parsed JSON body from the HTTP request.
   */
  readonly body: unknown

  /**
   * Source-control connection id applied to enqueued jobs.
   */
  readonly connectionId: string

  /**
   * Value of the `X-GitHub-Delivery` header, when present.
   */
  readonly deliveryId: string | undefined

  /**
   * Value of the `X-GitHub-Event` header, when present.
   */
  readonly event: string | undefined

  /**
   * Optional reviewer guidance applied to enqueued jobs.
   */
  readonly instructions?: string
}
