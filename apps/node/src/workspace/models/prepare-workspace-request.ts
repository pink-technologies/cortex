// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Request describing the repository workspace to prepare.
 */
export interface PrepareWorkspaceRequest {
  /**
   * Authentication token injected into the clone URL.
   */
  readonly accessToken: string

  /**
   * Optional base revision used to resolve a merge base for diff-style reviews.
   *
   * When set, {@link GitWorkspaceManager.prepare} fetches this ref and deepens
   * history until `git merge-base` succeeds (or history is exhausted).
   */
  readonly baseRef?: string

  /**
   * Credential-free HTTPS clone URL.
   */
  readonly cloneUrl: string

  /**
   * Revision to check out after cloning.
   */
  readonly headRef: string

  /**
   * Abort signal for cooperative cancellation.
   */
  readonly signal: AbortSignal
}
