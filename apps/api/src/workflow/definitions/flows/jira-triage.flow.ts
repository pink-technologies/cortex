// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../datatypes'
import type { WorkflowDefinition } from '../models'
import { JiraTriageFlowDefinitionKey } from '../keys'

/**
 * One-step flow that runs a `jira.triage` execution job.
 */
export const jiraTriageFlow: WorkflowDefinition = {
  key: JiraTriageFlowDefinitionKey,
  steps: [
    {
      key: 'main',
      kind: WorkflowStepKind.JOB,
      jobKind: JiraTriageJobKind,
      position: 0,
    },
  ],
}
