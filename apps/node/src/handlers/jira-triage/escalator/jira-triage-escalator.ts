// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import type { JiraTriageEscalation, JiraTriageFix, JiraTriageJobResult, JiraTriageRepro } from '@cortex/protocol'
import type { JiraCommentResource, JiraIssueResource } from '@cortex/integrations/jira'
import type { ResolvedJiraRepository } from '../models'
import { JiraTriageEscalationError } from '../error/error'

/**
 * Inputs for posting a triage escalation comment and optional reassignment.
 */
export type JiraTriageEscalateRequest = {
  readonly comment: string
  readonly comments: JiraCommentResource
  readonly escalateAccountId: string | undefined
  readonly issueKey: string
  readonly issues: JiraIssueResource
  readonly reason: string
  readonly reassign: boolean
  readonly signal: AbortSignal
}

/**
 * Inputs for formatting a Cortex QA escalation comment body.
 */
export type JiraTriageEscalationCommentInput = {
  readonly classification: JiraTriageJobResult['classification']
  readonly fix?: JiraTriageFix
  readonly issueKey: string
  readonly reason: string
  readonly repository?: ResolvedJiraRepository
  readonly repro?: JiraTriageRepro
}

/**
 * Posts Jira escalation comments and optional reassignment for triage outcomes.
 */
@Injectable()
export class JiraTriageEscalator {
  // MARK: - Instance methods

  /**
   * Comments on the issue and optionally reassigns it to a human.
   *
   * @param input - Comment body, Jira resources, and reassignment controls.
   * @returns Structured escalation outcome for the job result.
   * @throws {@link JiraTriageEscalationError} when Jira comment/assign fails.
   */
  async escalate(input: JiraTriageEscalateRequest): Promise<JiraTriageEscalation> {
    input.signal.throwIfAborted()

    try {
      await input.comments.create(input.issueKey, input.comment, input.signal)

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

  /**
   * Formats the Markdown comment body posted when escalating a triage outcome.
   *
   * @param input - Classification and optional repro/fix context.
   * @returns Comment body suitable for {@link JiraCommentResource.create}.
   */
  formatComment(input: JiraTriageEscalationCommentInput): string {
    const lines = [
      `Cortex QA triage for \`${input.issueKey}\``,
      '',
      `- Classification: ${input.classification.class} (confidence ${input.classification.confidence})`,
      `- Automation eligible: ${input.classification.automationEligible}`,
      `- Rationale: ${input.classification.rationale}`,
      `- Outcome: ${input.reason}`,
    ]

    if (input.repository) {
      lines.push(`- Repository: ${input.repository.owner}/${input.repository.name} (${input.repository.source})`)
    }

    if (input.repro) {
      lines.push(`- Repro: ${input.repro.status} — ${input.repro.summary}`)
      for (const suite of input.repro.suites) {
        lines.push(
          `  - ${suite.suiteId}: \`${suite.command}\`${suite.exitCode === undefined ? '' : ` (exit ${suite.exitCode})`}`,
        )
      }
    }

    if (input.fix) {
      lines.push(`- Fix attempted: ${input.fix.attempted}, succeeded: ${input.fix.succeeded}`)
      if (input.fix.pullRequestUrl) {
        lines.push(`- Draft PR: ${input.fix.pullRequestUrl}`)
      }
    }

    return lines.join('\n')
  }
}
