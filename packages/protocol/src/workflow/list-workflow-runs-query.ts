// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { WorkflowRunStatusSchema } from './workflow-run-status'

/**
 * Validates the query string accepted when listing workflow runs.
 *
 * Numeric parameters arrive as strings on the query string and are coerced;
 * omitted parameters fall back to the documented defaults. The schema is
 * strict so unknown parameters fail closed and surface protocol drift between
 * API and clients.
 */
export const ListWorkflowRunsQuerySchema = z
  .object({
    /**
     * Restrict results to runs of this workflow definition.
     *
     * Omit to include every definition.
     */
    definitionKey: z.string().min(1).optional(),

    /**
     * Maximum number of runs per page. Defaults to `20`; capped at `100`.
     */
    limit: z.coerce.number().int().min(1).max(100).default(20),

    /**
     * 1-based page index. Defaults to the first page.
     */
    page: z.coerce.number().int().min(1).default(1),

    /**
     * Restrict results to runs currently in this lifecycle status.
     *
     * Omit to include every status.
     */
    status: WorkflowRunStatusSchema.optional(),
  })
  .strict()

/**
 * Validated workflow-run listing query exchanged through the shared protocol.
 */
export type ListWorkflowRunsQuery = z.infer<typeof ListWorkflowRunsQuerySchema>
