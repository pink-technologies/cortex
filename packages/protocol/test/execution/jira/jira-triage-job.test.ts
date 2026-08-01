// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  CreateJiraTriageJobRequestSchema,
  JiraTriageJobKind,
  JiraTriageJobPayloadSchema,
} from '../../../src'
import { JiraTriageJobResultSchema } from '../../../src/execution/jira/jira-triage-job-result'

describe('jira.triage protocol', () => {
  it('exposes a stable job kind', () => {
    expect(JiraTriageJobKind).toBe('jira.triage')
  })

  it('accepts a minimal create request', () => {
    const parsed = CreateJiraTriageJobRequestSchema.parse({
      payload: {
        connectionId: 'jira-main',
        issueKey: 'JC-123',
      },
    })

    expect(parsed.priority).toBe(0)
    expect(parsed.payload.options).toEqual({
      attemptFix: true,
      dryRunTests: false,
    })
  })

  it('rejects payloads with unknown properties', () => {
    expect(() =>
      JiraTriageJobPayloadSchema.parse({
        connectionId: 'jira-main',
        issueKey: 'JC-123',
        unexpected: true,
      }),
    ).toThrow()
  })

  it('accepts a completed triage result', () => {
    const result = JiraTriageJobResultSchema.parse({
      classification: {
        automationEligible: true,
        class: 'bug',
        confidence: 0.9,
        rationale: 'Clear defect report.',
      },
      escalation: {
        action: 'none',
        reason: 'Reproduced and fixed.',
      },
      fix: {
        attempted: true,
        pullRequestUrl: 'https://github.com/pink-tech/cortex/pull/1',
        succeeded: true,
        summary: 'Patched null guard.',
      },
      issueKey: 'JC-123',
      repro: {
        status: 'reproduced',
        summary: 'Unit suite failed as described.',
        suites: [
          {
            command: 'npm test',
            exitCode: 1,
            suiteId: 'unit',
            summary: '1 failing',
          },
        ],
      },
      repository: {
        cloneUrl: 'https://github.com/pink-tech/cortex.git',
        defaultBranch: 'main',
        name: 'cortex',
        owner: 'pink-tech',
        source: 'project_map',
      },
    })

    expect(result.issueKey).toBe('JC-123')
  })
})
