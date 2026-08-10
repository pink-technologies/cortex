// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { repositoryReviewFlow } from '@/workflow/definitions'
import type { GitHubWebhookRoute, GitHubWebhookRouteHandleParameters } from '../github-webhook-route'
import {
  GitHubPullRequestWebhookPayloadSchema,
  GitHubWebhookDecisionKind,
  GitHubWebhookIgnoreReason,
  type GitHubWebhookDecision,
} from '../../models'

/**
 * Pull-request actions that enqueue a repository review.
 */
const GitHubPullRequestReviewActions = [
  'opened',
  'synchronize',
  'reopened',
  'ready_for_review',
  'review_requested',
] as const

/**
 * GitHub webhook route that decides whether a pull-request delivery should
 * enqueue a repository-review workflow run.
 *
 * Selected by the shared ingress when `X-GitHub-Event` is `pull_request`.
 * Preconditions: the dispatcher has already verified the webhook signature and
 * confirmed the event is in {@link repositoryReviewRoute.events}. This handler
 * does not re-check HMAC or the event allowlist.
 *
 * Returns {@link GitHubWebhookDecisionKind.ENQUEUE} when:
 * - the body parses as a pull-request payload
 * - `action` is one of {@link GitHubPullRequestReviewActions}
 * - the PR is not a draft, or `action` is `ready_for_review`
 *
 * Otherwise returns {@link GitHubWebhookDecisionKind.IGNORE} with a
 * {@link GitHubWebhookIgnoreReason}:
 * - `invalid_pull_request_payload` — body failed schema validation
 * - `unsupported_action:<action>` — action is outside the review allowlist
 * - `draft_pull_request` — draft PR that is not becoming ready for review
 *
 * On enqueue, `definitionKey` is {@link repositoryReviewFlow},
 * `triggerIdentifier` is
 * `github:pull_request:<owner>/<name>:<number>:<headSha>` (idempotency key for
 * the PR head revision). The payload uses `reviewMode: 'diff'` and optional
 * `instructions` from the route parameters when present.
 */
export const repositoryReviewRoute: GitHubWebhookRoute = {
  // MARK: - Properties

  /**
   * Only `pull_request` deliveries are handled by this route.
   *
   * GitHub sends `X-GitHub-Event: pull_request`; review triggers are filtered
   * by {@link GitHubPullRequestReviewActions} on the payload `action`.
   */
  events: ['pull_request'],

  /**
   * Stable id for registry lookup and logs.
   */
  name: 'repository-review',

  // MARK: - GitHubWebhookRoute

  /**
   * Decides whether one allowlisted pull-request delivery should enqueue a review.
   *
   * @param parameters - Connection id, optional instructions, and parsed body.
   * @returns A {@link GitHubWebhookDecision} to enqueue or ignore.
   */
  handle(parameters: GitHubWebhookRouteHandleParameters): GitHubWebhookDecision {
    const content = GitHubPullRequestWebhookPayloadSchema.safeParse(parameters.body)

    if (!content.success) {
      return {
        kind: GitHubWebhookDecisionKind.IGNORE,
        reason: GitHubWebhookIgnoreReason.INVALID_PULL_REQUEST_PAYLOAD,
      }
    }

    const { action, pull_request: pullRequest, repository } = content.data

    if (!(GitHubPullRequestReviewActions as readonly string[]).includes(action)) {
      return {
        kind: GitHubWebhookDecisionKind.IGNORE,
        reason: `unsupported_action:${action}`,
      }
    }

    if (pullRequest.draft === true && action !== 'ready_for_review') {
      return {
        kind: GitHubWebhookDecisionKind.IGNORE,
        reason: GitHubWebhookIgnoreReason.DRAFT_PULL_REQUEST,
      }
    }

    const owner = repository.owner.login

    return {
      kind: GitHubWebhookDecisionKind.ENQUEUE,
      definitionKey: repositoryReviewFlow.key,
      triggerIdentifier: `github:pull_request:${owner}/${repository.name}:${pullRequest.number}:${pullRequest.head.sha}`,
      payload: {
        connectionId: parameters.connectionId,
        ...(parameters.instructions ? { instructions: parameters.instructions } : {}),
        reviewMode: 'diff',
        change: {
          baseRef: pullRequest.base.ref,
          headRef: pullRequest.head.ref,
          pullRequestNumber: pullRequest.number,
        },
        repository: {
          cloneUrl: repository.clone_url,
          name: repository.name,
          owner,
        },
      },
    }
  },
}
