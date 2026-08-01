// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  GitHubPullRequestReviewActions,
  GitHubPullRequestWebhookPayloadSchema,
  type GitHubReviewEnqueueMapping,
} from '../models'

/**
 * Maps a GitHub webhook event into a repository-review enqueue request.
 *
 * Only `pull_request` events with actions in
 * {@link GitHubPullRequestReviewActions} produce work. Draft PRs are ignored
 * until `ready_for_review` (or they become non-draft via reopen/sync).
 *
 * @param event - Value of the `X-GitHub-Event` header.
 * @param body - Parsed JSON body from GitHub.
 * @param connectionId - Node-local source-control connection id.
 * @param instructions - Optional reviewer guidance applied to every job.
 * @returns Enqueue mapping or an ignore reason.
 */
export function mapGitHubWebhookToReviewEnqueue(
  event: string | undefined,
  body: unknown,
  connectionId: string,
  instructions?: string,
): GitHubReviewEnqueueMapping {
  if (!event) {
    return { kind: 'ignore', reason: 'missing_event' }
  }

  if (event === 'ping') {
    return { kind: 'ignore', reason: 'ping' }
  }

  if (event !== 'pull_request') {
    return { kind: 'ignore', reason: `unsupported_event:${event}` }
  }

  const parsed = GitHubPullRequestWebhookPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return { kind: 'ignore', reason: 'invalid_pull_request_payload' }
  }

  const { action, pull_request: pullRequest, repository } = parsed.data

  if (
    !(GitHubPullRequestReviewActions as readonly string[]).includes(action)
  ) {
    return { kind: 'ignore', reason: `unsupported_action:${action}` }
  }

  if (pullRequest.draft === true && action !== 'ready_for_review') {
    return { kind: 'ignore', reason: 'draft_pull_request' }
  }

  const owner = repository.owner.login
  const name = repository.name
  const pullRequestNumber = pullRequest.number
  const headSha = pullRequest.head.sha

  return {
    kind: 'enqueue',
    payload: {
      change: {
        baseRef: pullRequest.base.ref,
        headRef: pullRequest.head.ref,
        pullRequestNumber,
      },
      connectionId,
      ...(instructions ? { instructions } : {}),
      repository: {
        cloneUrl: repository.clone_url,
        name,
        owner,
      },
      reviewMode: 'diff',
    },
    triggerIdentifier: `github:pull_request:${owner}/${name}:${pullRequestNumber}:${headSha}`,
  }
}
