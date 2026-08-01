// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { JiraTriageJobPayloadSchema } from './jira-triage-job-payload'

/**
 * Validates the request body used to enqueue a `jira.triage` execution job.
 *
 * Accepted by the Cortex API when a caller manually requests Jira triage.
 */
export const CreateJiraTriageJobRequestSchema = z
  .object({
    /**
     * Handler-specific input for the `jira.triage` job.
     */
    payload: JiraTriageJobPayloadSchema,

    /**
     * Integer queue weight; higher values are preferred during claim.
     */
    priority: z.number().int().default(0),
  })
  .strict()

/**
 * Validated request used to enqueue a `jira.triage` execution job.
 */
export type CreateJiraTriageJobRequest = z.infer<typeof CreateJiraTriageJobRequestSchema>
