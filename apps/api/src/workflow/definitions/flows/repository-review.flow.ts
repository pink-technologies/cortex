// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { RepositoryReviewJobKind } from '@cortex/protocol'
import { WorkflowStepKind } from '../../datatypes'
import type { WorkflowDefinition } from '../models'

/**
 * One-step entrypoint that runs a single `repository.review` job.
 *
 * Registered as `repository.review.flow`. Start input is forwarded as the
 * child job payload (no `buildPayload`); callers must supply a value that
 * satisfies {@link RepositoryReviewJobPayloadSchema}. The run becomes
 * `RUNNING` and the step `QUEUED` when the job is enqueued; the step moves to
 * `RUNNING` when a node claims the job, then completes or fails with that job.
 *
 * Prefer embedding `repository.review` inside a multi-step definition (for
 * example {@link issueImplementFlow}) when the review should target a change
 * produced by an earlier step.
 */
export const repositoryReviewFlow = {
  key: 'repository.review.flow',
  version: 1,
  steps: [
    {
      key: 'main',
      kind: WorkflowStepKind.JOB,
      jobKind: RepositoryReviewJobKind,
      position: 0,
    },
  ],
} as const satisfies WorkflowDefinition
