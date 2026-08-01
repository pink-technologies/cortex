// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowRunStatus, WorkflowStepKind, WorkflowStepStatus } from '../../src/workflow/datatypes'
import { WorkflowRun } from '../../src/workflow/models'

describe('WorkflowRun', () => {
  it('maps a run with unordered steps into position order', () => {
    const now = new Date('2026-08-01T12:00:00.000Z')

    const run = WorkflowRun.from({
      activeKey: 'active-1',
      completedAt: null,
      createdAt: now,
      definitionKey: 'issue.implement.flow',
      failedAt: null,
      failure: null,
      id: 'run-1',
      input: { issueKey: 'JC-9' },
      result: null,
      startedAt: null,
      status: 'PENDING',
      triggerIdentifier: 'trigger-1',
      updatedAt: now,
      steps: [
        {
          completedAt: null,
          createdAt: now,
          failedAt: null,
          id: 'step-2',
          input: null,
          jobKind: null,
          key: 'approval',
          kind: 'APPROVAL',
          output: null,
          position: 1,
          runId: 'run-1',
          startedAt: null,
          status: 'PENDING',
          updatedAt: now,
        },
        {
          completedAt: null,
          createdAt: now,
          failedAt: null,
          id: 'step-1',
          input: { issueKey: 'JC-9' },
          jobKind: 'jira.triage',
          key: 'triage',
          kind: 'JOB',
          output: null,
          position: 0,
          runId: 'run-1',
          startedAt: null,
          status: 'PENDING',
          updatedAt: now,
        },
      ],
    })

    expect(run.id).toBe('run-1')
    expect(run.status).toBe(WorkflowRunStatus.PENDING)
    expect(run.steps.map((step) => step.key)).toEqual(['triage', 'approval'])
    expect(run.steps[0]?.kind).toBe(WorkflowStepKind.JOB)
    expect(run.steps[0]?.status).toBe(WorkflowStepStatus.PENDING)
    expect(run.steps[0]?.isTerminal).toBe(false)
    expect(run.steps[1]?.kind).toBe(WorkflowStepKind.APPROVAL)
  })

  it('reports terminal step statuses via isTerminal', () => {
    const now = new Date('2026-08-01T12:00:00.000Z')

    const completed = WorkflowRun.from({
      activeKey: null,
      completedAt: now,
      createdAt: now,
      definitionKey: 'jira.triage.flow',
      failedAt: null,
      failure: null,
      id: 'run-terminal',
      input: {},
      result: null,
      startedAt: now,
      status: 'COMPLETED',
      triggerIdentifier: null,
      updatedAt: now,
      steps: [
        {
          completedAt: now,
          createdAt: now,
          failedAt: null,
          id: 'step-terminal',
          input: null,
          jobKind: 'jira.triage',
          key: 'main',
          kind: 'JOB',
          output: null,
          position: 0,
          runId: 'run-terminal',
          startedAt: now,
          status: 'COMPLETED',
          updatedAt: now,
        },
      ],
    }).steps[0]!

    expect(completed.isTerminal).toBe(true)
  })

  it('maps a run without included steps to an empty step list', () => {
    const now = new Date('2026-08-01T12:00:00.000Z')

    const run = WorkflowRun.from({
      activeKey: null,
      completedAt: null,
      createdAt: now,
      definitionKey: 'agent.execute.flow',
      failedAt: null,
      failure: null,
      id: 'run-2',
      input: {},
      result: null,
      startedAt: null,
      status: 'RUNNING',
      triggerIdentifier: null,
      updatedAt: now,
    })

    expect(run.status).toBe(WorkflowRunStatus.RUNNING)
    expect(run.steps).toEqual([])
  })
})
