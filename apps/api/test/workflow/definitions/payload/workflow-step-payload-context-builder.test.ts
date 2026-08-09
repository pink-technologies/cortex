// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowStepPayloadContextBuilder } from '../../../../src/workflow/definitions/payload'
import { WorkflowRunStatus, WorkflowStepKind, WorkflowStepStatus } from '../../../../src/workflow/datatypes'
import { WorkflowRun } from '../../../../src/workflow/models/workflow-run'
import { WorkflowStep } from '../../../../src/workflow/models/workflow-step'

describe('WorkflowStepPayloadContextBuilder', () => {
  it('builds an initial context from input only', () => {
    const context = new WorkflowStepPayloadContextBuilder().withInput({ issueKey: 'JC-1' }).build()

    expect(context).toEqual({
      input: { issueKey: 'JC-1' },
      latestOutput: undefined,
      outputs: {},
    })
  })

  it('accumulates non-null outputs and tracks latestOutput', () => {
    const context = new WorkflowStepPayloadContextBuilder()
      .withInput({ issueKey: 'JC-1' })
      .addOutput('triage', { class: 'bug' })
      .addOutput('implement', null)
      .addOutput('review', { approved: true })
      .build()

    expect(context).toEqual({
      input: { issueKey: 'JC-1' },
      latestOutput: { approved: true },
      outputs: {
        triage: { class: 'bug' },
        review: { approved: true },
      },
    })
  })

  it('uses completing-step output overrides when walking the run', () => {
    const now = new Date()
    const triage = new WorkflowStep(
      'step-1',
      'run-1',
      'triage',
      0,
      WorkflowStepKind.JOB,
      WorkflowStepStatus.COMPLETED,
      'jira.triage',
      null,
      { class: 'bug' },
      now,
      now,
    )
    const implement = new WorkflowStep(
      'step-2',
      'run-1',
      'implement',
      1,
      WorkflowStepKind.JOB,
      WorkflowStepStatus.RUNNING,
      'agent.execute',
      null,
      null,
      now,
      now,
    )
    const run = new WorkflowRun(
      'run-1',
      'issue.implement.flow',
      1,
      WorkflowRunStatus.RUNNING,
      { issueKey: 'JC-1' },
      [triage, implement],
      now,
      now,
    )

    const context = new WorkflowStepPayloadContextBuilder()
      .withInput(run.input)
      .addOutputsThroughStep(run, implement, { prUrl: 'https://example.com/pr/1' })
      .build()

    expect(context).toEqual({
      input: { issueKey: 'JC-1' },
      latestOutput: { prUrl: 'https://example.com/pr/1' },
      outputs: {
        triage: { class: 'bug' },
        implement: { prUrl: 'https://example.com/pr/1' },
      },
    })
  })

  it('clears accumulated state after build', () => {
    const builder = new WorkflowStepPayloadContextBuilder()
      .withInput({ issueKey: 'JC-1' })
      .addOutput('triage', { class: 'bug' })

    builder.build()

    expect(builder.build()).toEqual({
      input: undefined,
      latestOutput: undefined,
      outputs: {},
    })
  })
})
