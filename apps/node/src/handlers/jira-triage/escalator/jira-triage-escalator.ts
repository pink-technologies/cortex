// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import type { JiraTriageEscalation } from '@cortex/protocol'
import { JiraTriageEscalationError } from '../error/error'
import {
  JiraCommentMentionPlaceholder,
  type JiraCommentMention,
  type JiraCommentResource,
  type JiraIssueResource,
} from '@cortex/integrations/jira'

/**
 * Plain-language finish outcomes posted when triage ends.
 */
export type JiraTriageFinishOutcome =
  | 'not_bug'
  | 'wrong_assignee'
  | 'missing_repo'
  | 'ambiguous_repo'
  | 'no_suites'
  | 'suite_broken'
  | 'not_reproduced'
  | 'reproduced_no_fix'
  | 'reproduced_fix_failed'
  | 'fix_succeeded'
  | 'classify_only'
  | 'dry_run'

/**
 * Inputs for posting a triage escalation comment and optional reassignment.
 */
export type JiraTriageEscalateRequest = {
  readonly comment: string
  readonly comments: JiraCommentResource
  readonly escalateAccountId: string | undefined
  readonly issueKey: string
  readonly issues: JiraIssueResource
  readonly mention?: JiraCommentMention
  readonly reason: string
  readonly reassign: boolean
  readonly signal: AbortSignal
}

/**
 * Inputs for formatting a human finish comment.
 */
export type JiraTriageFinishCommentInput = {
  readonly mentionDisplayName?: string
  readonly outcome: JiraTriageFinishOutcome
  readonly pullRequestUrl?: string
}

/**
 * Posts Jira start/finish comments and optional reassignment for triage outcomes.
 */
@Injectable()
export class JiraTriageEscalator {
  // MARK: - Instance methods

  /**
   * Formats the short “looking at this ticket” comment.
   *
   * @returns Comment body for {@link JiraCommentResource.create}.
   */
  formatStartComment(): string {
    return ['Cortex is looking at this ticket.', '', 'I’ll leave an update here when I’m done.'].join('\n')
  }

  /**
   * Formats a plain-language finish comment for humans.
   *
   * When `mentionDisplayName` is set on escalate outcomes, inserts
   * {@link JiraCommentMentionPlaceholder} for a real Jira @-mention.
   *
   * @param input - Finish outcome and optional mention / PR details.
   * @returns Comment body for {@link JiraCommentResource.create}.
   */
  formatFinishComment(input: JiraTriageFinishCommentInput): string {
    const header = 'Cortex is done with this ticket.'
    const body = this.finishBody(input)
    return [header, '', body].join('\n')
  }

  /**
   * Comments on the issue and optionally reassigns it to a human.
   *
   * @param input - Comment body, optional mention, Jira resources, and reassignment.
   * @returns Structured escalation outcome for the job result.
   * @throws {@link JiraTriageEscalationError} when Jira comment/assign fails.
   */
  async escalate(input: JiraTriageEscalateRequest): Promise<JiraTriageEscalation> {
    input.signal.throwIfAborted()

    try {
      await input.comments.create(input.issueKey, input.comment, input.signal, input.mention)

      if (input.reassign && input.escalateAccountId) {
        await input.issues.assign(input.issueKey, input.escalateAccountId, input.signal)

        return {
          action: 'reassign',
          assigneeAccountId: input.escalateAccountId,
          reason: input.reason,
        }
      }

      return {
        action: 'comment',
        reason: input.reason,
      }
    } catch (error) {
      throw new JiraTriageEscalationError(input.issueKey, `Failed to escalate Jira issue '${input.issueKey}'.`, {
        cause: error,
      })
    }
  }

  // MARK: - Private methods

  /**
   * Builds the second paragraph for a finish comment.
   *
   * @param input - Finish outcome inputs.
   * @returns Plain-language body sentence(s).
   */
  private finishBody(input: JiraTriageFinishCommentInput): string {
    const escalateSuffix = this.escalateSuffix(input.mentionDisplayName)

    switch (input.outcome) {
      case 'not_bug':
        return 'This doesn’t look like a bug, so I didn’t go further.'
      case 'wrong_assignee':
        return 'I skipped it because it isn’t assigned to me.'
      case 'missing_repo':
      case 'ambiguous_repo':
        return `I don’t know which GitHub project this belongs to. ${escalateSuffix}`
      case 'no_suites':
        return `There’s nothing set up for me to check this project yet. ${escalateSuffix}`
      case 'suite_broken':
        return `I couldn’t check this one properly — something’s off with the project setup. ${escalateSuffix}`
      case 'not_reproduced':
        return `I wasn’t able to recreate the problem. ${escalateSuffix}`
      case 'reproduced_no_fix':
      case 'reproduced_fix_failed':
        return `I was able to recreate the problem, but I couldn’t fix it on my own. ${escalateSuffix}`
      case 'fix_succeeded':
        return input.pullRequestUrl
          ? `I recreated the problem and opened a draft change for review:\n${input.pullRequestUrl}`
          : 'I recreated the problem and opened a draft change for review.'
      case 'classify_only':
        return 'I only did a quick read of the ticket.'
      case 'dry_run':
        return 'This was a dry run, so I didn’t change anything.'
    }
  }

  private escalateSuffix(mentionDisplayName: string | undefined): string {
    if (mentionDisplayName?.trim()) {
      return `Escalating the issue to ${JiraCommentMentionPlaceholder}.`
    }

    return 'Escalating this to the project owner.'
  }
}
