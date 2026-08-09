// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Inputs for {@link GitHubPullResource.createDraft}.
 *
 * Branch refs and presentation fields for the draft pull request. Repository
 * owner and name are supplied separately to
 * {@link GitHubPullResource.createDraft}. The resource always opens the pull
 * request as a draft; callers do not set draft status here.
 */
export interface GitHubCreateDraftPullRequest {
  /**
   * Existing branch the draft pull request merges into (base ref).
   *
   * Typically the repository default branch (for example `main`).
   */
  readonly base: string

  /**
   * Description shown on the draft pull request.
   *
   * GitHub renders Markdown; plain text is accepted as-is.
   */
  readonly body: string

  /**
   * Branch that contains the proposed changes (head ref).
   *
   * For same-repository drafts, pass the branch name. Cross-fork heads use
   * GitHub's `owner:branch` form when required.
   */
  readonly head: string

  /**
   * Title shown on the draft pull request.
   */
  readonly title: string
}
