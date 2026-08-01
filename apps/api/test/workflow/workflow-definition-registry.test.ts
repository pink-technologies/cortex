// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowStepKind } from '../../src/workflow/datatypes'
import {
  AgentExecuteJobKind,
  JiraTriageJobKind,
  RepositoryReviewJobKind,
} from '@cortex/protocol'

import {
  agentExecuteFlow,
  AgentExecuteFlowDefinitionKey,
  issueImplementFlow,
  IssueImplementFlowDefinitionKey,
  jiraTriageFlow,
  JiraTriageFlowDefinitionKey,
  repositoryReviewFlow,
  RepositoryReviewFlowDefinitionKey,
  WorkflowDefinitionRegistry,
} from '../../src/workflow/definitions'

import {
  WorkflowDefinitionAlreadyRegisteredError,
  WorkflowDefinitionInvalidError,
  WorkflowDefinitionNotFoundError,
} from '../../src/workflow/error/error'

function registerBuiltInFlows(registry: WorkflowDefinitionRegistry): void {
  registry.register(agentExecuteFlow)
  registry.register(issueImplementFlow)
  registry.register(jiraTriageFlow)
  registry.register(repositoryReviewFlow)
}

describe('WorkflowDefinitionRegistry', () => {
  it('resolves built-in one-step flows to existing job kinds', () => {
    const registry = new WorkflowDefinitionRegistry()
    registerBuiltInFlows(registry)

    expect(registry.resolve(JiraTriageFlowDefinitionKey)).toEqual({
      key: JiraTriageFlowDefinitionKey,
      steps: [
        {
          key: 'main',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 0,
        },
      ],
    })

    expect(registry.resolve(RepositoryReviewFlowDefinitionKey).steps[0]?.jobKind).toBe(
      RepositoryReviewJobKind,
    )
    expect(registry.resolve(AgentExecuteFlowDefinitionKey).steps[0]?.jobKind).toBe(AgentExecuteJobKind)
  })

  it('resolves the issue.implement.flow stub with triage through approval', () => {
    const registry = new WorkflowDefinitionRegistry()
    registerBuiltInFlows(registry)

    const definition = registry.resolve(IssueImplementFlowDefinitionKey)

    expect(definition.steps.map((step) => step.key)).toEqual([
      'triage',
      'implement',
      'review',
      'approval',
    ])
    expect(definition.steps.map((step) => step.kind)).toEqual([
      WorkflowStepKind.JOB,
      WorkflowStepKind.JOB,
      WorkflowStepKind.JOB,
      WorkflowStepKind.APPROVAL,
    ])
    expect(definition.steps.map((step) => step.jobKind)).toEqual([
      JiraTriageJobKind,
      AgentExecuteJobKind,
      RepositoryReviewJobKind,
      undefined,
    ])
  })

  it('throws when resolving an unknown definition key', () => {
    const registry = new WorkflowDefinitionRegistry()

    expect(() => registry.resolve('missing.flow')).toThrow(WorkflowDefinitionNotFoundError)
    expect(registry.has('missing.flow')).toBe(false)
  })

  it('rejects duplicate registration', () => {
    const registry = new WorkflowDefinitionRegistry()
    registerBuiltInFlows(registry)

    expect(() => registry.register(registry.resolve(JiraTriageFlowDefinitionKey))).toThrow(
      WorkflowDefinitionAlreadyRegisteredError,
    )
  })

  it('rejects invalid definitions', () => {
    const registry = new WorkflowDefinitionRegistry()

    expect(() =>
      registry.register({
        key: 'empty.steps.flow',
        steps: [],
      }),
    ).toThrow(WorkflowDefinitionInvalidError)

    expect(() =>
      registry.register({
        key: 'missing.job-kind.flow',
        steps: [
          {
            key: 'main',
            kind: WorkflowStepKind.JOB,
            position: 0,
          },
        ],
      }),
    ).toThrow(WorkflowDefinitionInvalidError)

    expect(() =>
      registry.register({
        key: 'approval.with.job-kind.flow',
        steps: [
          {
            key: 'approval',
            kind: WorkflowStepKind.APPROVAL,
            jobKind: JiraTriageJobKind,
            position: 0,
          },
        ],
      }),
    ).toThrow(WorkflowDefinitionInvalidError)

    expect(() =>
      registry.register({
        key: 'duplicate.step.flow',
        steps: [
          {
            key: 'main',
            kind: WorkflowStepKind.JOB,
            jobKind: JiraTriageJobKind,
            position: 0,
          },
          {
            key: 'main',
            kind: WorkflowStepKind.JOB,
            jobKind: JiraTriageJobKind,
            position: 1,
          },
        ],
      }),
    ).toThrow(WorkflowDefinitionInvalidError)
  })
})
