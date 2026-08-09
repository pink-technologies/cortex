// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraCommentMentionPlaceholder } from '@cortex/integrations/jira'
import type { JiraCommentResource, JiraIssueResource } from '@cortex/integrations/jira'
import { JiraTriageEscalator } from '../../../../src/handlers/jira-triage/escalator/jira-triage-escalator'
import { JiraTriageEscalationError } from '../../../../src/handlers/jira-triage/error/error'

describe('JiraTriageEscalator', () => {
  it('formats a short start comment', () => {
    const escalator = new JiraTriageEscalator()
    const comment = escalator.formatStartComment()

    expect(comment).toContain('Cortex is looking at this ticket.')
    expect(comment).toContain('I’ll leave an update here when I’m done.')
    expect(comment).not.toContain('classify')
    expect(comment).not.toContain('mapped tests')
  })

  it('formats suite_broken with a mention placeholder when a lead name is known', () => {
    const escalator = new JiraTriageEscalator()
    const comment = escalator.formatFinishComment({
      mentionDisplayName: 'Jorge Orjuela',
      outcome: 'suite_broken',
    })

    expect(comment).toContain('Cortex is done with this ticket.')
    expect(comment).toContain('something’s off with the project setup')
    expect(comment).toContain(`Escalating the issue to ${JiraCommentMentionPlaceholder}.`)
    expect(comment).not.toContain('suite_broken')
    expect(comment).not.toContain('automationEligible')
  })

  it('formats escalate finishes without a lead as project owner', () => {
    const escalator = new JiraTriageEscalator()
    const comment = escalator.formatFinishComment({ outcome: 'not_reproduced' })

    expect(comment).toContain('I wasn’t able to recreate the problem.')
    expect(comment).toContain('Escalating this to the project owner.')
    expect(comment).not.toContain(JiraCommentMentionPlaceholder)
  })

  it('formats fix_succeeded with a draft change link', () => {
    const escalator = new JiraTriageEscalator()
    const comment = escalator.formatFinishComment({
      outcome: 'fix_succeeded',
      pullRequestUrl: 'https://github.com/acme/app/pull/1',
    })

    expect(comment).toContain('opened a draft change for review')
    expect(comment).toContain('https://github.com/acme/app/pull/1')
  })

  it('formats the remaining human finish outcomes', () => {
    const escalator = new JiraTriageEscalator()

    expect(escalator.formatFinishComment({ outcome: 'not_bug' })).toContain(
      'doesn’t look like a bug',
    )
    expect(escalator.formatFinishComment({ outcome: 'wrong_assignee' })).toContain(
      'isn’t assigned to me',
    )
    expect(escalator.formatFinishComment({ outcome: 'missing_repo' })).toContain(
      'which GitHub project',
    )
    expect(escalator.formatFinishComment({ outcome: 'ambiguous_repo' })).toContain(
      'which GitHub project',
    )
    expect(escalator.formatFinishComment({ outcome: 'no_suites' })).toContain(
      'nothing set up for me to check',
    )
    expect(
      escalator.formatFinishComment({
        mentionDisplayName: 'Lead',
        outcome: 'reproduced_fix_failed',
      }),
    ).toContain('couldn’t fix it on my own')
    expect(escalator.formatFinishComment({ outcome: 'reproduced_no_fix' })).toContain(
      'couldn’t fix it on my own',
    )
    expect(escalator.formatFinishComment({ outcome: 'classify_only' })).toContain(
      'quick read of the ticket',
    )
    expect(escalator.formatFinishComment({ outcome: 'dry_run' })).toContain('dry run')
    expect(escalator.formatFinishComment({ outcome: 'fix_succeeded' })).toContain(
      'draft change for review',
    )
  })

  it('comments and reassigns when escalateAccountId is provided', async () => {
    const create = jest.fn().mockResolvedValue(undefined)
    const assign = jest.fn().mockResolvedValue(undefined)
    const escalator = new JiraTriageEscalator()

    const result = await escalator.escalate({
      comment: 'body',
      comments: { create } as unknown as JiraCommentResource,
      escalateAccountId: 'human',
      issueKey: 'JC-11',
      issues: { assign } as unknown as JiraIssueResource,
      mention: { accountId: 'human', displayName: 'Human Lead' },
      reason: 'Needs a human.',
      reassign: true,
      signal: new AbortController().signal,
    })

    expect(create).toHaveBeenCalledWith(
      'JC-11',
      'body',
      expect.any(AbortSignal),
      { accountId: 'human', displayName: 'Human Lead' },
    )
    expect(assign).toHaveBeenCalledWith('JC-11', 'human', expect.any(AbortSignal))
    expect(result).toEqual({
      action: 'reassign',
      assigneeAccountId: 'human',
      reason: 'Needs a human.',
    })
  })

  it('comments without reassignment when reassign is false', async () => {
    const create = jest.fn().mockResolvedValue(undefined)
    const assign = jest.fn().mockResolvedValue(undefined)
    const escalator = new JiraTriageEscalator()

    const result = await escalator.escalate({
      comment: 'body',
      comments: { create } as unknown as JiraCommentResource,
      escalateAccountId: 'human',
      issueKey: 'JC-11',
      issues: { assign } as unknown as JiraIssueResource,
      reason: 'Dry-run only.',
      reassign: false,
      signal: new AbortController().signal,
    })

    expect(assign).not.toHaveBeenCalled()
    expect(result).toEqual({
      action: 'comment',
      reason: 'Dry-run only.',
    })
  })

  it('wraps Jira failures as JiraTriageEscalationError', async () => {
    const escalator = new JiraTriageEscalator()

    await expect(
      escalator.escalate({
        comment: 'body',
        comments: {
          create: jest.fn().mockRejectedValue(new Error('jira down')),
        } as unknown as JiraCommentResource,
        escalateAccountId: undefined,
        issueKey: 'JC-11',
        issues: { assign: jest.fn() } as unknown as JiraIssueResource,
        reason: 'Assignee gate failed.',
        reassign: false,
        signal: new AbortController().signal,
      }),
    ).rejects.toBeInstanceOf(JiraTriageEscalationError)
  })
})
