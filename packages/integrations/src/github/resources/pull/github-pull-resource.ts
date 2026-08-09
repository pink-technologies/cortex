// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod, JSONParameterEncoder } from '@cortex/networking'
import type { GitHubClient } from '../../github-client'
import { GitHubDraftPullCreationError, GitHubDraftPullMissingUrlError, GitHubPullLookupError } from './error/error'
import { GitHubPullRequest, type GitHubPullRequestResponse } from './models'
import { GitHubCreateDraftPullRequest } from './parameters'

/**
 * GitHub REST resource for the `/repos/{owner}/{repo}/pulls` path.
 *
 * Loads pull-request details and opens draft pull requests. Transport and auth
 * are provided by the injected {@link GitHubClient}. Wire payloads are mapped
 * to {@link GitHubPullRequest} via {@link GitHubPullRequest.from}.
 */
export class GitHubPullResource {
  // MARK: - Properties

  private readonly client: GitHubClient

  // MARK: - Constructor

  /**
   * Creates a pull-request resource bound to a GitHub client.
   *
   * @param client - Authenticated client for the target GitHub API.
   */
  constructor(client: GitHubClient) {
    this.client = client
  }

  // MARK: - Instance methods

  /**
   * Opens a draft pull request via `POST /repos/{owner}/{repo}/pulls`.
   *
   * @param owner - Repository owner or organization.
   * @param repository - Repository name.
   * @param draft - Draft pull-request fields.
   * @param signal - Aborts the in-flight request when triggered.
   * @returns HTML URL of the created pull request.
   * @throws {@link GitHubDraftPullMissingUrlError} when the response omits `html_url`.
   * @throws {@link GitHubDraftPullCreationError} when the create request fails.
   */
  async createDraft(
    owner: string,
    repository: string,
    draft: GitHubCreateDraftPullRequest,
    signal: AbortSignal,
  ): Promise<string> {
    signal.throwIfAborted()

    try {
      const payload = await this.client.request<GitHubPullRequestResponse>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls`,
        {
          method: HTTPMethod.POST,
          parameterEncoder: JSONParameterEncoder.default,
          parameters: {
            base: draft.base,
            body: draft.body,
            draft: true,
            head: draft.head,
            title: draft.title,
          },
          signal,
        },
      )

      if (!payload.html_url) {
        throw new GitHubDraftPullMissingUrlError(owner, repository)
      }

      return payload.html_url
    } catch (error) {
      if (error instanceof GitHubDraftPullMissingUrlError || signal.aborted) {
        throw error
      }

      throw new GitHubDraftPullCreationError(owner, repository, { cause: error })
    }
  }

  /**
   * Loads a pull request via `GET /repos/{owner}/{repo}/pulls/{pull_number}`.
   *
   * @param owner - Repository owner or organization.
   * @param repository - Repository name.
   * @param pullNumber - Pull-request number.
   * @param signal - Aborts the in-flight request when triggered.
   * @returns Domain {@link GitHubPullRequest}.
   * @throws {@link GitHubPullLookupError} when the request fails.
   */
  async get(owner: string, repository: string, pullNumber: number, signal: AbortSignal): Promise<GitHubPullRequest> {
    signal.throwIfAborted()

    try {
      const payload = await this.client.request<GitHubPullRequestResponse>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${pullNumber}`,
        {
          method: HTTPMethod.GET,
          signal,
        },
      )

      return GitHubPullRequest.from(payload)
    } catch (error) {
      if (signal.aborted) {
        throw error
      }

      throw new GitHubPullLookupError(owner, repository, pullNumber, { cause: error })
    }
  }
}
