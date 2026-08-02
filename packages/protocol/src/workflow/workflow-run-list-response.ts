// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { WorkflowRunResponseSchema } from './workflow-run-response'

/**
 * Validates the response body returned when listing workflow runs.
 *
 * A single page of the run collection ordered newest first, together with the
 * paging values the page was resolved with and the total match count so
 * clients can compute page boundaries. The schema is strict so unknown
 * properties fail closed and surface protocol drift between API and clients.
 */
export const WorkflowRunListResponseSchema = z
  .object({
    /**
     * Runs on this page, ordered by creation time descending.
     */
    items: z.array(WorkflowRunResponseSchema),

    /**
     * Maximum number of runs per page the query was resolved with.
     */
    limit: z.number().int().min(1),

    /**
     * 1-based page index the query was resolved with.
     */
    page: z.number().int().min(1),

    /**
     * Total number of runs matching the query across all pages.
     */
    total: z.number().int().min(0),
  })
  .strict()

/**
 * Validated workflow-run listing response exchanged through the shared protocol.
 */
export type WorkflowRunListResponse = z.infer<typeof WorkflowRunListResponseSchema>
