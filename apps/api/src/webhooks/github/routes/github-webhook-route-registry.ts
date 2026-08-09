// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { GitHubWebhookRoute } from './github-webhook-route'
import { repositoryReviewRoute } from './repository-review/repository-review.route'

/**
 * Registered GitHub webhook routes keyed by {@link GitHubWebhookRoute.name}.
 *
 * Add new product intents by exporting a route and registering it here.
 * The shared ingress dispatches by matching `X-GitHub-Event` to each route's
 * `events`, then calls `handle`.
 */
export const GITHUB_WEBHOOK_ROUTES: ReadonlyMap<string, GitHubWebhookRoute> = new Map([
  [repositoryReviewRoute.name, repositoryReviewRoute],
])
