// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../datatypes'
import type { WorkflowDefinition } from '../models'

/**
 * One-step entrypoint that runs a single `jira.triage` job.
 *
 * Registered as `jira.triage.flow`. Start input is forwarded as the child job
 * payload (no `buildPayload`); callers must supply a value that satisfies
 * {@link JiraTriageJobPayloadSchema}. The run becomes `RUNNING` when the job
 * is queued and completes or fails with that job.
 *
 * Prefer embedding `jira.triage` inside a multi-step definition (for example
 * {@link issueImplementFlow}) when classification should feed later steps.
 */
export const jiraTriageFlow = {
  key: 'jira.triage.flow',
  version: 1,
  steps: [
    {
      key: 'main',
      kind: WorkflowStepKind.JOB,
      jobKind: JiraTriageJobKind,
      position: 0,
    },
  ],
} satisfies WorkflowDefinition
