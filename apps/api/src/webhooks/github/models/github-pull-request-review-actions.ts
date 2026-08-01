// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Pull-request actions that enqueue a repository review.
 */
export const GitHubPullRequestReviewActions = [
  'opened',
  'synchronize',
  'reopened',
  'ready_for_review',
] as const

/**
 * Pull-request action that may enqueue a repository review.
 */
export type GitHubPullRequestReviewAction =
  (typeof GitHubPullRequestReviewActions)[number]
