// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Placeholder embedded in comment text that {@link JiraADFBuilder.addBody}
 * replaces with an ADF mention when a {@link JiraCommentMention} is provided.
 */
export const JiraCommentMentionPlaceholder = '{{cortex_mention}}'

/**
 * Resolved Jira user used as an @-mention in {@link JiraCommentResource.create}.
 *
 * When passed as `mention` and the comment body contains
 * {@link JiraCommentMentionPlaceholder}, that token is replaced with an
 * Atlassian Document Format mention node that tags this user.
 */
export interface JiraCommentMention {
  /**
   * Atlassian account id written to the ADF mention `attrs.id`.
   *
   * Identifies who is tagged (for example from a user search by email).
   */
  readonly accountId: string

  /**
   * Label shown on the mention in Jira.
   *
   * A leading `@` is optional; {@link JiraADFBuilder.addMention} adds one when
   * missing before writing ADF `attrs.text`.
   */
  readonly displayName: string
}
