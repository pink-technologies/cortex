// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowRun } from './workflow-run'

/**
 * Outcome of an idempotent workflow-run insert.
 *
 * Produced by {@link WorkflowRunRepository.getOrCreate}. When
 * {@link created} is `false`, {@link run} is the pre-existing row matched by
 * `triggerIdentifier` or `activeKey`.
 */
export interface CreateWorkflowRunResult {
  /**
   * Whether this call inserted a new run.
   *
   * `false` when an existing run was returned for the same idempotency key.
   */
  readonly created: boolean

  /**
   * Persisted run with steps ordered by `position`.
   */
  readonly run: WorkflowRun
}
