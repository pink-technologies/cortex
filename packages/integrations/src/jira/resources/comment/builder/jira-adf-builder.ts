// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraCommentMentionPlaceholder, type JiraCommentMention } from '../models'

/**
 * Atlassian Document Format (ADF) document posted as a Jira comment `body`.
 *
 * Shape matches what Jira Cloud expects on
 * `POST /rest/api/3/issue/{issueKey}/comment`: a `doc` root with one paragraph
 * of inline nodes (text, hard breaks, mentions).
 */
export interface JiraADFDocument {
  /**
   * Top-level block nodes. This builder always emits exactly one paragraph.
   */
  readonly content: readonly [
    {
      /**
       * Inline nodes inside the paragraph (`text`, `hardBreak`, `mention`, …).
       */
      readonly content: readonly Record<string, unknown>[]

      /**
       * Paragraph block type required by ADF for comment bodies.
       */
      readonly type: 'paragraph'
    },
  ]

  /**
   * ADF document root type (`doc`).
   */
  readonly type: 'doc'

  /**
   * ADF schema version required by Jira Cloud comment APIs (`1`).
   */
  readonly version: 1
}

/**
 * Fluent builder for Atlassian Document Format (ADF) comment bodies.
 *
 * Callers append inline nodes with {@link addText}, {@link addMention}, or
 * {@link addBody}, then call {@link build} to produce a
 * {@link JiraADFDocument} for {@link JiraCommentResource.create}. Nodes
 * accumulate until {@link build}, which clears the instance so the same
 * builder can build another document.
 */
export class JiraADFBuilder {
  // MARK: - Properties

  private readonly nodes: Record<string, unknown>[] = []

  // MARK: - Instance methods

  /**
   * Appends plain-text body content, optionally inserting an @-mention.
   *
   * When `mention` is set and `body` contains
   * {@link JiraCommentMentionPlaceholder}, the placeholder is split out and
   * replaced with an ADF mention node between the surrounding text segments.
   * Newlines inside segments become hard breaks via {@link addText}. When there
   * is no mention or no placeholder, the entire `body` is appended as text.
   *
   * @param body - Plain-text comment content; may include the mention placeholder.
   * @param mention - Optional resolved user to tag at each placeholder occurrence.
   * @returns This builder for chaining.
   */
  addBody(body: string, mention?: JiraCommentMention): this {
    const hasMention = mention && body.includes(JiraCommentMentionPlaceholder)
    const segments = hasMention ? body.split(JiraCommentMentionPlaceholder) : [body]

    for (let index = 0; index < segments.length; index += 1) {
      this.addText(segments[index] ?? '')

      if (mention && index < segments.length - 1) {
        this.addMention(mention)
      }
    }

    return this
  }

  /**
   * Appends an ADF mention node that tags a resolved Jira user.
   *
   * Writes `accountId` to mention `attrs.id` and a display label to
   * `attrs.text`, prefixing `@` when `displayName` does not already start with
   * one.
   *
   * @param mention - User identity for the mention attrs.
   * @returns This builder for chaining.
   */
  addMention(mention: JiraCommentMention): this {
    const text = mention.displayName.startsWith('@') ? mention.displayName : `@${mention.displayName}`
    const mentionNode = {
      attrs: {
        accessLevel: '',
        id: mention.accountId,
        text,
      },
      type: 'mention',
    }

    this.nodes.push(mentionNode)

    return this
  }

  /**
   * Appends plain text as ADF text nodes, converting newlines to hard breaks.
   *
   * Empty strings add no nodes. Consecutive newlines yield consecutive
   * `hardBreak` nodes with no empty text between them.
   *
   * @param text - Plain text to append.
   * @returns This builder for chaining.
   */
  addText(text: string): this {
    this.nodes.push(...JiraADFBuilder.textWithBreaks(text))
    return this
  }

  /**
   * Builds a single-paragraph {@link JiraADFDocument} from accumulated nodes.
   *
   * When no nodes were added, the paragraph contains one empty text node so
   * Jira still receives a valid document. Clears this builder afterward so a
   * later {@link addBody}, {@link addMention}, or {@link addText} starts a new
   * document on the same instance.
   *
   * @returns ADF document suitable for the comment API `body` field.
   */
  build(): JiraADFDocument {
    const content = this.nodes.length === 0 ? [{ text: '', type: 'text' }] : [...this.nodes]
    
    this.nodes.length = 0

    return {
      content: [
        {
          content,
          type: 'paragraph',
        },
      ],
      type: 'doc',
      version: 1,
    }
  }

  // MARK: - Private methods

  private static textWithBreaks(text: string): readonly Record<string, unknown>[] {
    if (text.length === 0) {
      return []
    }

    const lines = text.split('\n')
    const nodes: Record<string, unknown>[] = []

    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index]!.length > 0) {
        nodes.push({ text: lines[index], type: 'text' })
      }

      if (index < lines.length - 1) {
        nodes.push({ type: 'hardBreak' })
      }
    }

    return nodes
  }
}
