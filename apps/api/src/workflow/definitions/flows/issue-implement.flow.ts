// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentExecuteJobKind, JiraTriageJobKind, RepositoryReviewJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../datatypes'
import type { WorkflowDefinition } from '../models'
import { IssueImplementFlowDefinitionKey } from '../keys'

/**
 * Multi-step issue implement flow (definition stub for later chunks).
 *
 * Shape only: Triage → Implement → Review → Approval. Start/advance wiring
 * and step payload mapping land in Chunks 4–10.
 */
export const issueImplementFlow: WorkflowDefinition = {
  key: IssueImplementFlowDefinitionKey,
  steps: [
    {
      key: 'triage',
      kind: WorkflowStepKind.JOB,
      jobKind: JiraTriageJobKind,
      position: 0,
    },
    {
      key: 'implement',
      kind: WorkflowStepKind.JOB,
      jobKind: AgentExecuteJobKind,
      position: 1,
    },
    {
      key: 'review',
      kind: WorkflowStepKind.JOB,
      jobKind: RepositoryReviewJobKind,
      position: 2,
    },
    {
      key: 'approval',
      kind: WorkflowStepKind.APPROVAL,
      position: 3,
    },
  ],
}
