// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { RepositoryReviewJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../datatypes'
import type { WorkflowDefinition } from '../models'
import { RepositoryReviewFlowDefinitionKey } from '../keys'

/**
 * One-step flow that runs a `repository.review` execution job.
 */
export const repositoryReviewFlow: WorkflowDefinition = {
  key: RepositoryReviewFlowDefinitionKey,
  steps: [
    {
      key: 'main',
      kind: WorkflowStepKind.JOB,
      jobKind: RepositoryReviewJobKind,
      position: 0,
    },
  ],
}
