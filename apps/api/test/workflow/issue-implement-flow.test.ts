// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ZodError } from 'zod'
import { issueImplementFlow } from '../../src/workflow/definitions'
import type { WorkflowStepPayloadContext } from '../../src/workflow/definitions'
import { issueImplementFlowInput, jiraTriageJobResult } from './issue-implement-fixtures'

function stepBuilder(key: string): (context: WorkflowStepPayloadContext) => unknown {
  const step = issueImplementFlow.steps.find((candidate) => candidate.key === key)

  if (!step?.buildPayload) {
    throw new Error(`issue.implement.flow step ${key} has no buildPayload`)
  }

  return step.buildPayload
}

describe('issueImplementFlow payload builders', () => {
  const input = issueImplementFlowInput('JC-40')

  describe('triage', () => {
    it('builds a jira.triage payload from the run input with autofix off', () => {
      const payload = stepBuilder('triage')({
        input,
        latestOutput: undefined,
        outputs: {},
      })

      expect(payload).toEqual({
        connectionId: input.jiraConnectionId,
        issueKey: input.issueKey,
        options: {
          attemptFix: false,
          classifyOnly: false,
          dryRunTests: false,
        },
        repository: input.repository,
        sourceControlConnectionId: input.sourceControlConnectionId,
      })
    })

    it('rejects an input missing required fields', () => {
      expect(() =>
        stepBuilder('triage')({
          input: { issueKey: 'JC-40' },
          latestOutput: undefined,
          outputs: {},
        }),
      ).toThrow(ZodError)
    })
  })

  describe('implement', () => {
    it('builds an agent.execute payload from the input and triage output', () => {
      const triage = jiraTriageJobResult(input.issueKey)

      const payload = stepBuilder('implement')({
        input,
        latestOutput: triage,
        outputs: { triage },
      }) as { agentId: string; input: string }

      expect(payload.agentId).toBe(input.agentId)
      expect(payload.input).toContain(input.issueKey)
      expect(payload.input).toContain(triage.classification.rationale)
      expect(payload.input).toContain(triage.repro?.summary)
    })

    it('rejects a missing or malformed triage output', () => {
      expect(() =>
        stepBuilder('implement')({
          input,
          latestOutput: undefined,
          outputs: {},
        }),
      ).toThrow(ZodError)

      expect(() =>
        stepBuilder('implement')({
          input,
          latestOutput: { unexpected: true },
          outputs: { triage: { unexpected: true } },
        }),
      ).toThrow(ZodError)
    })
  })

  describe('review', () => {
    it('builds a full repository.review payload against the default branch', () => {
      const payload = stepBuilder('review')({
        input,
        latestOutput: undefined,
        outputs: {},
      })

      expect(payload).toEqual({
        change: {
          headRef: input.repository.defaultBranch,
        },
        connectionId: input.sourceControlConnectionId,
        instructions: `Review the implementation for Jira issue ${input.issueKey}.`,
        repository: {
          cloneUrl: input.repository.cloneUrl,
          name: input.repository.name,
          owner: input.repository.owner,
        },
        reviewMode: 'full',
      })
    })
  })
})
