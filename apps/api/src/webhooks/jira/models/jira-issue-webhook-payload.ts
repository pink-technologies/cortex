// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Zod subset of a Jira issue webhook payload used for triage enqueue.
 */
export const JiraIssueWebhookPayloadSchema = z
  .object({
    issue: z
      .object({
        key: z.string().trim().min(1),
        fields: z
          .object({
            assignee: z
              .object({
                accountId: z.string().trim().min(1).optional(),
                emailAddress: z.string().trim().email().optional(),
              })
              .passthrough()
              .nullable()
              .optional(),
            updated: z.string().trim().min(1).optional(),
          })
          .passthrough(),
      })
      .passthrough(),
    webhookEvent: z.string().trim().min(1).optional(),
  })
  .passthrough()

/**
 * Validated Jira issue webhook body.
 */
export type JiraIssueWebhookPayload = z.infer<typeof JiraIssueWebhookPayloadSchema>
