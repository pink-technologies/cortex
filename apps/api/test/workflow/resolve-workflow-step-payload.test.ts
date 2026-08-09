// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../src/workflow/datatypes'
import { resolveWorkflowStepPayload } from '../../src/workflow/definitions'
import type { WorkflowDefinitionStep } from '../../src/workflow/definitions'

describe('resolveWorkflowStepPayload', () => {
  const jobStep: WorkflowDefinitionStep = {
    key: 'main',
    kind: WorkflowStepKind.JOB,
    jobKind: JiraTriageJobKind,
    position: 0,
  }

  it('defaults to the latest step output', () => {
    const payload = resolveWorkflowStepPayload(jobStep, {
      input: { issueKey: 'JC-1' },
      latestOutput: { summary: 'done' },
      outputs: { previous: { summary: 'done' } },
    })

    expect(payload).toEqual({ summary: 'done' })
  })

  it('falls back to the run input when no output exists', () => {
    const payload = resolveWorkflowStepPayload(jobStep, {
      input: { issueKey: 'JC-2' },
      latestOutput: undefined,
      outputs: {},
    })

    expect(payload).toEqual({ issueKey: 'JC-2' })
  })

  it('delegates to the step buildPayload when declared', () => {
    const step: WorkflowDefinitionStep = {
      ...jobStep,
      buildPayload: (context) => ({
        fromBuilder: true,
        seenOutputs: Object.keys(context.outputs),
      }),
    }

    const payload = resolveWorkflowStepPayload(step, {
      input: { issueKey: 'JC-3' },
      latestOutput: { summary: 'ignored by builder' },
      outputs: { triage: { summary: 'ignored by builder' } },
    })

    expect(payload).toEqual({
      fromBuilder: true,
      seenOutputs: ['triage'],
    })
  })

  it('propagates buildPayload failures to the caller', () => {
    const step: WorkflowDefinitionStep = {
      ...jobStep,
      buildPayload: () => {
        throw new Error('invalid context')
      },
    }

    expect(() =>
      resolveWorkflowStepPayload(step, {
        input: {},
        latestOutput: undefined,
        outputs: {},
      }),
    ).toThrow('invalid context')
  })
})
