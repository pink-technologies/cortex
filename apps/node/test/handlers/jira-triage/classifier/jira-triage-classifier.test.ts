// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentDefinition, SkillRegistry } from '@cortex/agent-runtime'
import { JiraIssue, JiraIssueAssignee } from '@cortex/integrations/jira'
import { JiraTriageClassifier } from '../../../../src/handlers/jira-triage/classifier/jira-triage-classifier'
import { JiraTriageClassificationError } from '../../../../src/handlers/jira-triage/error/error'
import type { AgentProcessResolver } from '../../../../src/agent/agent-process-resolver'
import type { ExecutionEngine } from '../../../../src/execution-engine'

describe('JiraTriageClassifier', () => {
  const issue = new JiraIssue(
    new JiraIssueAssignee('automation'),
    {},
    'Null pointer when saving',
    'Bug',
    'JC-9',
    ['bug'],
    'JC',
    [],
    'Crash on save',
  )

  const qaAgent = {
    id: 'qa',
    descriptor: {
      capabilities: ['jira.triage'],
      delegatesTo: [],
      name: 'QA',
      role: 'specialist',
      skills: ['ticket-classify'],
      systemPrompt: 'You are QA.',
    },
    safety: {
      allowCapabilityUse: true,
      allowDelegation: false,
      allowSkillUse: true,
      maxDelegationDepth: 0,
    },
  } as unknown as AgentDefinition

  it('maps engine output into a structured classification', async () => {
    const run = jest.fn().mockResolvedValue({
      output: JSON.stringify({
        automationEligible: true,
        class: 'bug',
        confidence: 0.91,
        rationale: 'Crash stack present.',
      }),
    })

    const classifier = new JiraTriageClassifier(
      {
        resolveAgent: jest.fn().mockReturnValue(qaAgent),
      } as unknown as AgentProcessResolver,
      { run } as unknown as ExecutionEngine,
      {
        resolve: jest.fn().mockReturnValue({ prompt: 'Classify carefully.' }),
      } as unknown as SkillRegistry,
    )

    const result = await classifier.classify(issue, new AbortController().signal)

    expect(result).toEqual({
      automationEligible: true,
      class: 'bug',
      confidence: 0.91,
      rationale: 'Crash stack present.',
    })
    expect(run).toHaveBeenCalled()
  })

  it('skips skill prompts when the QA agent disallows skill use', async () => {
    const run = jest.fn().mockResolvedValue({
      output: JSON.stringify({
        automationEligible: true,
        class: 'bug',
        confidence: 0.8,
        rationale: 'Clear crash.',
      }),
    })
    const resolveSkill = jest.fn()

    const classifier = new JiraTriageClassifier(
      {
        resolveAgent: jest.fn().mockReturnValue({
          ...qaAgent,
          safety: {
            ...qaAgent.safety,
            allowSkillUse: false,
          },
        }),
      } as unknown as AgentProcessResolver,
      { run } as unknown as ExecutionEngine,
      { resolve: resolveSkill } as unknown as SkillRegistry,
    )

    await classifier.classify(issue, new AbortController().signal)

    expect(resolveSkill).not.toHaveBeenCalled()
    expect(run).toHaveBeenCalled()
  })

  it('wraps engine failures as JiraTriageClassificationError', async () => {
    const classifier = new JiraTriageClassifier(
      {
        resolveAgent: jest.fn().mockReturnValue(qaAgent),
      } as unknown as AgentProcessResolver,
      {
        run: jest.fn().mockRejectedValue(new Error('engine down')),
      } as unknown as ExecutionEngine,
      {
        resolve: jest.fn().mockReturnValue({ prompt: 'Classify carefully.' }),
      } as unknown as SkillRegistry,
    )

    await expect(classifier.classify(issue, new AbortController().signal)).rejects.toBeInstanceOf(
      JiraTriageClassificationError,
    )
  })
})
