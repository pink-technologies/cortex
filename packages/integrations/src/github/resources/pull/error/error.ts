// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationsError } from '../../../../error/error'

/**
 * Thrown when a GitHub pull request cannot be loaded.
 *
 * Raised by {@link GitHubPullResource.get} when the request fails validation
 * or transport. The underlying networking failure is preserved in
 * {@link Error.cause}.
 */
export class GitHubPullLookupError extends IntegrationsError {
  // MARK: - Properties

  /**
   * Machine-readable code for GitHub pull-request lookup failures.
   */
  readonly code = 'GITHUB_PULL_LOOKUP_ERROR'

  /**
   * Repository owner.
   */
  readonly owner: string

  /**
   * Pull-request number requested from GitHub.
   */
  readonly pullNumber: number

  /**
   * Repository name.
   */
  readonly repository: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed pull-request lookup.
   *
   * @param owner - Repository owner.
   * @param repository - Repository name.
   * @param pullNumber - Pull-request number requested.
   * @param options - Optional error details, including the original cause.
   */
  constructor(owner: string, repository: string, pullNumber: number, options?: ErrorOptions) {
    super(`Failed to look up GitHub pull request ${owner}/${repository}#${pullNumber}`, options)

    this.owner = owner
    this.pullNumber = pullNumber
    this.repository = repository
  }
}

/**
 * Thrown when a draft pull request cannot be created on GitHub.
 *
 * Raised by {@link GitHubPullResource.createDraft} when the create request
 * fails. The underlying networking failure is preserved in {@link Error.cause}.
 */
export class GitHubDraftPullCreationError extends IntegrationsError {
  // MARK: - Properties

  /**
   * Machine-readable code for draft pull-request creation failures.
   */
  readonly code = 'GITHUB_DRAFT_PULL_CREATION_ERROR'

  /**
   * Repository owner.
   */
  readonly owner: string

  /**
   * Repository name.
   */
  readonly repository: string

  // MARK: - Constructor

  /**
   * Creates an error describing a failed draft pull-request creation.
   *
   * @param owner - Repository owner.
   * @param repository - Repository name.
   * @param options - Optional error details, including the original cause.
   */
  constructor(owner: string, repository: string, options?: ErrorOptions) {
    super(`Failed to create draft pull request for ${owner}/${repository}`, options)

    this.owner = owner
    this.repository = repository
  }
}

/**
 * Thrown when a draft pull request was created without a usable URL.
 *
 * Raised by {@link GitHubPullResource.createDraft} when the provider response
 * omits `html_url`.
 */
export class GitHubDraftPullMissingUrlError extends IntegrationsError {
  // MARK: - Properties

  /**
   * Machine-readable code for missing draft pull-request URL failures.
   */
  readonly code = 'GITHUB_DRAFT_PULL_MISSING_URL_ERROR'

  /**
   * Repository owner.
   */
  readonly owner: string

  /**
   * Repository name.
   */
  readonly repository: string

  // MARK: - Constructor

  /**
   * Creates an error describing a draft pull request without a URL.
   *
   * @param owner - Repository owner.
   * @param repository - Repository name.
   * @param options - Optional error details, including the original cause.
   */
  constructor(owner: string, repository: string, options?: ErrorOptions) {
    super(`Draft pull request for ${owner}/${repository} was created without a URL`, options)

    this.owner = owner
    this.repository = repository
  }
}
