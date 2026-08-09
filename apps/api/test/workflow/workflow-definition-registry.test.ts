// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowStepKind } from '../../src/workflow/datatypes'
import { AgentExecuteJobKind, JiraTriageJobKind, RepositoryReviewJobKind } from '@cortex/protocol'
import {
  agentExecuteFlow,
  issueImplementFlow,
  jiraTriageFlow,
  repositoryReviewFlow,
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

    expect(registry.resolve(jiraTriageFlow.key)).toEqual({
      key: jiraTriageFlow.key,
      version: 1,
      steps: [
        {
          key: 'main',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 0,
        },
      ],
    })

    expect(registry.resolve(repositoryReviewFlow.key).steps[0]?.jobKind).toBe(RepositoryReviewJobKind)
    expect(registry.resolve(agentExecuteFlow.key).steps[0]?.jobKind).toBe(AgentExecuteJobKind)
  })

  it('resolves the issue.implement.flow with triage through approval', () => {
    const registry = new WorkflowDefinitionRegistry()
    registerBuiltInFlows(registry)

    const definition = registry.resolve(issueImplementFlow.key)

    expect(definition.version).toBe(1)
    expect(definition.steps.map((step) => step.key)).toEqual(['triage', 'implement', 'review', 'approval'])
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
    expect(definition.steps.map((step) => typeof step.buildPayload)).toEqual([
      'function',
      'function',
      'function',
      'undefined',
    ])
  })

  it('stores steps ordered by position when registered out of order', () => {
    const registry = new WorkflowDefinitionRegistry()

    registry.register({
      key: 'unordered.flow',
      version: 1,
      steps: [
        {
          key: 'second',
          kind: WorkflowStepKind.JOB,
          jobKind: AgentExecuteJobKind,
          position: 1,
        },
        {
          key: 'first',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 0,
        },
      ],
    })

    expect(registry.resolve('unordered.flow').steps.map((step) => step.key)).toEqual(['first', 'second'])
  })

  it('resolves an exact pinned version and keeps later versions for new starts', () => {
    const registry = new WorkflowDefinitionRegistry()

    registry.register({
      key: 'versioned.flow',
      version: 1,
      steps: [
        {
          buildPayload: () => ({ revision: 1 }),
          key: 'main',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 0,
        },
      ],
    })
    registry.register({
      key: 'versioned.flow',
      version: 2,
      steps: [
        {
          buildPayload: () => ({ revision: 2 }),
          key: 'main',
          kind: WorkflowStepKind.JOB,
          jobKind: JiraTriageJobKind,
          position: 0,
        },
      ],
    })

    expect(registry.resolve('versioned.flow').version).toBe(2)
    expect(registry.resolve('versioned.flow', 1).version).toBe(1)
    expect(
      registry.resolve('versioned.flow', 1).steps[0]?.buildPayload?.({
        input: {},
        latestOutput: undefined,
        outputs: {},
      }),
    ).toEqual({ revision: 1 })
    expect(registry.has('versioned.flow', 1)).toBe(true)
    expect(registry.has('versioned.flow', 3)).toBe(false)
  })

  it('throws when resolving an unknown definition key', () => {
    const registry = new WorkflowDefinitionRegistry()

    expect(() => registry.resolve('missing.flow')).toThrow(WorkflowDefinitionNotFoundError)
    expect(registry.has('missing.flow')).toBe(false)
  })

  it('rejects duplicate key+version registration', () => {
    const registry = new WorkflowDefinitionRegistry()
    registerBuiltInFlows(registry)

    expect(() => registry.register(registry.resolve(jiraTriageFlow.key))).toThrow(
      WorkflowDefinitionAlreadyRegisteredError,
    )
  })

  it('rejects invalid definitions', () => {
    const registry = new WorkflowDefinitionRegistry()

    expect(() =>
      registry.register({
        key: 'empty.steps.flow',
        version: 1,
        steps: [],
      }),
    ).toThrow(WorkflowDefinitionInvalidError)

    expect(() =>
      registry.register({
        key: 'bad.version.flow',
        version: 0,
        steps: [
          {
            key: 'main',
            kind: WorkflowStepKind.JOB,
            jobKind: JiraTriageJobKind,
            position: 0,
          },
        ],
      }),
    ).toThrow(WorkflowDefinitionInvalidError)

    expect(() =>
      registry.register({
        key: 'missing.job-kind.flow',
        version: 1,
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
        version: 1,
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
        key: 'approval.with.build-payload.flow',
        version: 1,
        steps: [
          {
            buildPayload: () => ({}),
            key: 'approval',
            kind: WorkflowStepKind.APPROVAL,
            position: 0,
          },
        ],
      }),
    ).toThrow(WorkflowDefinitionInvalidError)

    expect(() =>
      registry.register({
        key: 'duplicate.step.flow',
        version: 1,
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
