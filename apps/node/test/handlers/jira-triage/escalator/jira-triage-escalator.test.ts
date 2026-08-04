// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraCommentResource, JiraIssueResource } from '@cortex/integrations/jira'
import { JiraTriageEscalator } from '../../../../src/handlers/jira-triage/escalator/jira-triage-escalator'
import { JiraTriageEscalationError } from '../../../../src/handlers/jira-triage/error/error'

describe('JiraTriageEscalator', () => {
  const classification = {
    automationEligible: false,
    class: 'chore' as const,
    confidence: 0.7,
    rationale: 'Not a bug.',
  }

  it('formats an escalation comment with classification fields', () => {
    const escalator = new JiraTriageEscalator()
    const comment = escalator.formatComment({
      classification,
      issueKey: 'JC-11',
      reason: 'Ticket is not an automation-eligible bug.',
    })

    expect(comment).toContain('JC-11')
    expect(comment).toContain('chore')
    expect(comment).toContain('Not a bug.')
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
      reason: 'Not automation-eligible.',
      reassign: true,
      signal: new AbortController().signal,
    })

    expect(create).toHaveBeenCalledWith('JC-11', 'body', expect.any(AbortSignal))
    expect(assign).toHaveBeenCalledWith('JC-11', 'human', expect.any(AbortSignal))
    expect(result).toEqual({
      action: 'reassign',
      assigneeAccountId: 'human',
      reason: 'Not automation-eligible.',
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

  it('formats repository, repro, and fix details when present', () => {
    const escalator = new JiraTriageEscalator()
    const comment = escalator.formatComment({
      classification,
      fix: {
        attempted: true,
        pullRequestUrl: 'https://github.com/pink-tech/cortex/pull/1',
        succeeded: true,
        summary: 'Patched null guard.',
      },
      issueKey: 'JC-11',
      reason: 'Fixed after repro.',
      repository: {
        cloneUrl: 'https://github.com/pink-tech/cortex.git',
        defaultBranch: 'main',
        name: 'cortex',
        owner: 'pink-tech',
        source: 'project_map',
      },
      repro: {
        status: 'reproduced',
        summary: 'Unit suite failed.',
        suites: [
          {
            command: 'npm test',
            exitCode: 1,
            suiteId: 'unit',
            summary: '1 failing',
          },
          {
            command: 'npm run e2e',
            suiteId: 'e2e',
            summary: 'skipped',
          },
        ],
      },
    })

    expect(comment).toContain('pink-tech/cortex (project_map)')
    expect(comment).toContain('reproduced — Unit suite failed.')
    expect(comment).toContain('unit: `npm test` (exit 1)')
    expect(comment).toContain('e2e: `npm run e2e`')
    expect(comment).toContain('Fix attempted: true, succeeded: true')
    expect(comment).toContain('Draft PR: https://github.com/pink-tech/cortex/pull/1')
  })

  it('formats a fix attempt without a draft PR URL', () => {
    const escalator = new JiraTriageEscalator()
    const comment = escalator.formatComment({
      classification,
      fix: {
        attempted: true,
        succeeded: false,
        summary: 'Could not land a patch.',
      },
      issueKey: 'JC-12',
      reason: 'Fix failed.',
    })

    expect(comment).toContain('Fix attempted: true, succeeded: false')
    expect(comment).not.toContain('Draft PR:')
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
