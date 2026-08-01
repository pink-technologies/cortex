// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod, JSONParameterEncoder } from '@cortex/networking'
import type { JiraClient } from '../../jira-client'
import { JiraAssignIssueError, JiraIssueLookupError } from './error/error'
import { JiraIssue, JiraIssueRemoteLink, type JiraIssueResponse, type JiraRemoteLinkResponse } from './models'

/**
 * Jira Cloud resource for the `/rest/api/3/issue` path.
 *
 * Loads issue details (including remote links) and updates assignees for triage.
 * Transport and auth are provided by the injected {@link JiraClient}. Wire
 * payloads are mapped to {@link JiraIssue} via {@link JiraIssue.from}.
 */
export class JiraIssueResource {
  // MARK: - Properties

  private readonly client: JiraClient

  // MARK: - Constructor

  /**
   * Creates an issue resource bound to a Jira client.
   *
   * @param client - Authenticated client for the target Jira site.
   */
  constructor(client: JiraClient) {
    this.client = client
  }

  // MARK: - Instance methods

  /**
   * Reassigns an issue via `PUT /rest/api/3/issue/{issueKey}/assignee`.
   *
   * Sends `{ accountId }` as a JSON body. Throws when the request is aborted,
   * validation fails, or transport fails.
   *
   * @param issueKey - Issue key to reassign (for example `JC-1`).
   * @param accountId - Atlassian account id of the new assignee.
   * @param signal - Aborts the in-flight request when triggered.
   * @throws {@link JiraAssignIssueError} when the assignee update fails.
   */
  async assign(issueKey: string, accountId: string, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted()

    try {
      await this.client.request(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/assignee`, {
        method: HTTPMethod.PUT,
        parameterEncoder: JSONParameterEncoder.default,
        parameters: { accountId },
        signal,
      })
    } catch (error) {
      if (signal.aborted) {
        throw error
      }

      throw new JiraAssignIssueError(issueKey, accountId, { cause: error })
    }
  }

  /**
   * Loads an issue via `GET /rest/api/3/issue/{issueKey}` and attaches remote links.
   *
   * Requests `expand=names`, then fetches
   * `GET /rest/api/3/issue/{issueKey}/remotelink`. Either request failing
   * surfaces as {@link JiraIssueLookupError}.
   *
   * @param issueKey - Issue key to load (for example `JC-1`).
   * @param signal - Aborts the in-flight request when triggered.
   * @returns Domain {@link JiraIssue} ready for triage.
   * @throws {@link JiraIssueLookupError} when the issue or remotelink request fails.
   */
  async get(issueKey: string, signal: AbortSignal): Promise<JiraIssue> {
    signal.throwIfAborted()

    try {
      const issuePayload = await this.client.request<JiraIssueResponse>(
        `/rest/api/3/issue/${encodeURIComponent(issueKey)}`,
        {
          method: HTTPMethod.GET,
          parameters: { expand: 'names' },
          signal,
        },
      )

      signal.throwIfAborted()

      const entries = await this.client.request<JiraRemoteLinkResponse[]>(
        `/rest/api/3/issue/${encodeURIComponent(issueKey)}/remotelink`,
        {
          method: HTTPMethod.GET,
          signal,
        },
      )

      const remoteLinks = entries
        .map((entry) => JiraIssueRemoteLink.from(entry))
        .filter((link): link is JiraIssueRemoteLink => link !== undefined)

      signal.throwIfAborted()

      return JiraIssue.from(issuePayload, remoteLinks, issueKey)
    } catch (error) {
      if (signal.aborted) {
        throw error
      }

      throw new JiraIssueLookupError(issueKey, { cause: error })
    }
  }
}
