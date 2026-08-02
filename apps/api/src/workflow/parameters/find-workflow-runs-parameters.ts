// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowRunStatus } from '../datatypes'

/**
 * Inputs for listing a page of {@link WorkflowRun} rows.
 *
 * Runs are ordered by creation time descending (newest first). Optional
 * filters combine with logical AND; omitted filters match every run.
 */
export interface FindWorkflowRunsParameters {
  /**
   * Restrict results to runs of this workflow definition.
   *
   * Omit to include every definition.
   */
  readonly definitionKey?: string

  /**
   * Maximum number of runs to return for this page.
   */
  readonly limit: number

  /**
   * 1-based page index; `skip = (page - 1) * limit`.
   */
  readonly page: number

  /**
   * Restrict results to runs currently in this lifecycle status.
   *
   * Omit to include every status.
   */
  readonly status?: WorkflowRunStatus
}
