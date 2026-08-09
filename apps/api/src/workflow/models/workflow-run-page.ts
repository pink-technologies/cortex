// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowRun } from './workflow-run'

/**
 * One page of a workflow-run listing.
 *
 * Produced by {@link WorkflowRunRepository.findMany} from
 * {@link FindWorkflowRunsParameters}. Mapped to the public list response by
 * {@link WorkflowRunListResponseMapper.from}.
 *
 * {@link items} are ordered by creation time descending (newest first). Each
 * run includes its steps ordered by `position`. {@link total} is the full
 * match count across every page for the same filters.
 */
export interface WorkflowRunPage {
  /**
   * Runs on this page, newest first, each with steps ordered by `position`.
   *
   * Length is at most the request `limit` and may be empty when the page is
   * past the last result.
   */
  readonly items: readonly WorkflowRun[]

  /**
   * Total number of runs matching the query filters across all pages.
   *
   * Independent of {@link items} length; use with `limit` to compute page
   * count.
   */
  readonly total: number
}
