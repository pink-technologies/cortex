// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod, JSONParameterEncoder } from '@cortex/networking'
import type { JiraClient } from '../../jira-client'
import { JiraAddCommentError } from './error/error'

/**
 * Jira Cloud resource for the `/rest/api/3/issue/{issueKey}/comment` path.
 *
 * Posts triage comments (escalation notes, status updates) onto issues.
 * Transport and auth are provided by the injected {@link JiraClient}.
 */
export class JiraCommentResource {
  // MARK: - Properties

  private readonly client: JiraClient

  // MARK: - Constructor

  /**
   * Creates a comment resource bound to a Jira client.
   *
   * @param client - Authenticated client for the target Jira site.
   */
  constructor(client: JiraClient) {
    this.client = client
  }

  // MARK: - Instance methods

  /**
   * Creates a comment via `POST /rest/api/3/issue/{issueKey}/comment`.
   *
   * Wraps `body` in a single-paragraph Atlassian Document Format (ADF) payload
   * and sends it as JSON. Throws when the request is aborted, validation fails,
   * or transport fails.
   *
   * @param issueKey - Issue key that receives the comment (for example `JC-1`).
   * @param body - Plain-text comment content placed in the ADF paragraph.
   * @param signal - Aborts the in-flight request when triggered.
   * @throws {@link JiraAddCommentError} when the comment create fails.
   */
  async create(issueKey: string, body: string, signal: AbortSignal): Promise<void> {
    signal.throwIfAborted()

    try {
      await this.client.request(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
        method: HTTPMethod.POST,
        parameterEncoder: JSONParameterEncoder.default,
        parameters: {
          body: {
            content: [
              {
                content: [{ text: body, type: 'text' }],
                type: 'paragraph',
              },
            ],
            type: 'doc',
            version: 1,
          },
        },
        signal,
      })
    } catch (error) {
      if (signal.aborted) {
        throw error
      }

      throw new JiraAddCommentError(issueKey, { cause: error })
    }
  }
}
