// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentDefinition, SkillRegistry } from '@cortex/agent-runtime'
import { JiraIssue, JiraIssueAssignee } from '@cortex/integrations/jira'
import { JiraTriageClassifier } from '../../../../src/handlers/jira-triage/classifier/jira-triage-classifier'
import { JiraTriageClassificationError } from '../../../../src/handlers/jira-triage/error/error'
import type { AgentProcessResolver } from '../../../../src/agent/agent-process-resolver'
import type { NodeConfiguration } from '../../../../src/configuration'
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

  const configuration = {
    jiraProjectRepos: [
      {
        areas: {
          App: {
            aliases: ['TruVideoApp'],
            suiteKeys: ['TruVideoSdkCore'],
          },
          Camera: {
            suiteKeys: ['TruVideoSdkCamera'],
          },
        },
        cloneUrl: 'https://github.com/acme/app.git',
        defaultBranch: 'main',
        name: 'app',
        owner: 'acme',
        projectKey: 'JC',
        suites: {
          TruVideoSdkCamera: { command: 'xcodebuild test -scheme TruVideoSdkCamera' },
          TruVideoSdkCore: { command: 'xcodebuild test -scheme TruVideoSdkCore' },
        },
      },
    ],
  } as unknown as NodeConfiguration

  function makeClassifier(overrides?: {
    readonly configuration?: NodeConfiguration
    readonly resolveAgentById?: jest.Mock
    readonly run?: jest.Mock
    readonly resolveSkill?: jest.Mock
  }): {
    readonly classifier: JiraTriageClassifier
    readonly run: jest.Mock
    readonly resolveSkill: jest.Mock
  } {
    const run =
      overrides?.run ??
      jest.fn().mockResolvedValue({
        output: JSON.stringify({
          areas: ['App'],
          automationEligible: true,
          class: 'bug',
          confidence: 0.91,
          rationale: 'Crash stack present.',
        }),
      })
    const resolveSkill =
      overrides?.resolveSkill ?? jest.fn().mockReturnValue({ prompt: 'Classify carefully.' })

    const classifier = new JiraTriageClassifier(
      {
        resolveAgent: overrides?.resolveAgentById ?? jest.fn().mockReturnValue(qaAgent),
      } as unknown as AgentProcessResolver,
      overrides?.configuration ?? configuration,
      { run } as unknown as ExecutionEngine,
      { resolve: resolveSkill } as unknown as SkillRegistry,
    )

    return { classifier, run, resolveSkill }
  }

  it('maps engine output into a structured classification', async () => {
    const { classifier, run } = makeClassifier()

    const result = await classifier.classify(issue, new AbortController().signal)

    expect(result).toEqual({
      areas: ['App'],
      automationEligible: true,
      class: 'bug',
      confidence: 0.91,
      rationale: 'Crash stack present.',
    })
    expect(String(run.mock.calls[0][0].prompt)).toContain('Known areas for this project')
    expect(String(run.mock.calls[0][0].prompt)).toContain('App, Camera')
  })

  it('skips skill prompts when the QA agent disallows skill use', async () => {
    const { classifier, run, resolveSkill } = makeClassifier({
      resolveAgentById: jest.fn().mockReturnValue({
        ...qaAgent,
        safety: {
          ...qaAgent.safety,
          allowSkillUse: false,
        },
      }),
      run: jest.fn().mockResolvedValue({
        output: JSON.stringify({
          automationEligible: true,
          class: 'bug',
          confidence: 0.8,
          rationale: 'Clear crash.',
        }),
      }),
    })

    await classifier.classify(issue, new AbortController().signal)

    expect(resolveSkill).not.toHaveBeenCalled()
    expect(run).toHaveBeenCalled()
  })

  it('wraps engine failures as JiraTriageClassificationError', async () => {
    const { classifier } = makeClassifier({
      run: jest.fn().mockRejectedValue(new Error('engine down')),
    })

    await expect(classifier.classify(issue, new AbortController().signal)).rejects.toBeInstanceOf(
      JiraTriageClassificationError,
    )
  })
})
