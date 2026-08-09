// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentExecuteJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../datatypes'
import type { WorkflowDefinition } from '../models'

/**
 * One-step entrypoint that runs a single `agent.execute` job.
 *
 * Registered as `agent.execute.flow`. Start input is forwarded as the child
 * job payload (no `buildPayload`); callers must supply a value that satisfies
 * {@link AgentExecuteJobPayloadSchema}. The run becomes `RUNNING` and the step
 * `QUEUED` when the job is enqueued; the step moves to `RUNNING` when a node
 * claims the job, then completes or fails with that job.
 *
 * Prefer embedding `agent.execute` inside a multi-step definition (for example
 * {@link issueImplementFlow}) when the agent needs prior-step context.
 */
export const agentExecuteFlow = {
  key: 'agent.execute.flow',
  version: 1,
  steps: [
    {
      key: 'main',
      kind: WorkflowStepKind.JOB,
      jobKind: AgentExecuteJobKind,
      position: 0,
    },
  ],
} satisfies WorkflowDefinition
