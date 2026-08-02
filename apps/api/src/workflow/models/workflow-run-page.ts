// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowRun } from './workflow-run'

/**
 * One page of a workflow-run listing.
 */
export interface WorkflowRunPage {
  /**
   * Runs on this page, ordered by creation time descending, each including
   * its ordered steps.
   */
  readonly items: readonly WorkflowRun[]

  /**
   * Total number of runs matching the query across all pages.
   */
  readonly total: number
}
