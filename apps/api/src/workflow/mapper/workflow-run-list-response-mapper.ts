// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowRunResponseMapper } from './workflow-run-response-mapper'
import type { WorkflowRunPage } from '../models'
import { WorkflowRunListResponseSchema, type WorkflowRunListResponse } from '@cortex/protocol'

/**
 * Maps a domain {@link WorkflowRunPage} into the public workflow-run listing
 * response.
 *
 * Delegates each run to {@link WorkflowRunResponseMapper}, attaches the paging
 * values the query was resolved with, and validates the result against
 * {@link WorkflowRunListResponseSchema}.
 */
export class WorkflowRunListResponseMapper {
  // MARK: - Static methods

  /**
   * Creates a protocol listing response from a domain workflow-run page.
   *
   * @param page - Domain page of runs with the total match count.
   * @param limit - Maximum number of runs per page the query was resolved with.
   * @param pageIndex - 1-based page index the query was resolved with.
   * @returns Validated workflow-run listing response.
   */
  static from(page: WorkflowRunPage, limit: number, pageIndex: number): WorkflowRunListResponse {
    return WorkflowRunListResponseSchema.parse({
      items: page.items.map((run) => WorkflowRunResponseMapper.from(run)),
      limit,
      page: pageIndex,
      total: page.total,
    })
  }
}
