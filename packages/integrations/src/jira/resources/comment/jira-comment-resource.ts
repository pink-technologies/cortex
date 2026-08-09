// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod, JSONParameterEncoder } from '@cortex/networking'
import type { JiraClient } from '../../jira-client'
import { JiraADFBuilder } from './builder'
import { JiraAddCommentError } from './error/error'
import type { JiraCommentMention } from './models'

/**
 * Jira Cloud resource for the `/rest/api/3/issue/{issueKey}/comment` path.
 *
 * Posts triage comments (escalation notes, status updates) onto issues.
 * Transport and auth are provided by the injected {@link JiraClient}.
 */
export class JiraCommentResource {
  // MARK: - Properties

  private readonly builder: JiraADFBuilder
  private readonly client: JiraClient

  // MARK: - Constructor

  /**
   * Creates a comment resource bound to a Jira client.
   *
   * @param client - Authenticated client for the target Jira site.
   * @param builder - ADF body builder used when creating comments. Defaults to a
   *   new {@link JiraADFBuilder}.
   */
  constructor(client: JiraClient, builder: JiraADFBuilder = new JiraADFBuilder()) {
    this.builder = builder
    this.client = client
  }

  // MARK: - Instance methods

  /**
   * Creates a comment via `POST /rest/api/3/issue/{issueKey}/comment`.
   *
   * Builds an Atlassian Document Format body via {@link JiraADFBuilder}.
   * When `mention` is set and `body` contains
   * {@link JiraCommentMentionPlaceholder}, that token becomes a real ADF
   * mention node (so the user is tagged). Newlines become hard breaks within a
   * single paragraph.
   *
   * @param issueKey - Issue key that receives the comment (for example `JC-1`).
   * @param body - Plain-text comment content; may include the mention placeholder.
   * @param signal - Aborts the in-flight request when triggered.
   * @param mention - Optional user to tag when the placeholder is present.
   * @throws {@link JiraAddCommentError} when the comment create fails.
   */
  async create(issueKey: string, body: string, signal: AbortSignal, mention?: JiraCommentMention): Promise<void> {
    signal.throwIfAborted()

    try {
      await this.client.request(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
        method: HTTPMethod.POST,
        parameterEncoder: JSONParameterEncoder.default,
        parameters: {
          body: this.builder.addBody(body, mention).build(),
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
