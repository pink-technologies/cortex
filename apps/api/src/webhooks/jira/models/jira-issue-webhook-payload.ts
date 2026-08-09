// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Zod schema for the Jira issue webhook body fields Cortex needs to enqueue
 * triage.
 *
 * This is a deliberate subset of Jira's payload. Unknown properties are
 * retained via `.passthrough()` so callers can inspect additional Jira fields
 * without failing validation. Invalid bodies map to an ignore outcome at the
 * route layer rather than an HTTP error.
 */
export const JiraIssueWebhookPayloadSchema = z
  .object({
    /**
     * Issue that triggered the webhook.
     */
    issue: z
      .object({
        /**
         * Issue key within the Jira project (for example `JC-42`).
         */
        key: z.string().trim().min(1),

        /**
         * Issue fields used for assignee gating and idempotency.
         */
        fields: z
          .object({
            /**
             * Current assignee, when present.
             *
             * Used by the triage route assignee gate. `null` or absent means
             * unassigned.
             */
            assignee: z
              .object({
                /**
                 * Atlassian account id of the assignee.
                 */
                accountId: z.string().trim().min(1).optional(),

                /**
                 * Assignee email when Jira includes it on the payload.
                 */
                emailAddress: z.string().trim().email().optional(),
              })
              .passthrough()
              .nullable()
              .optional(),

            /**
             * Issue `updated` timestamp used in triage idempotency keys.
             *
             * When absent, the triage route substitutes `"unknown"`.
             */
            updated: z.string().trim().min(1).optional(),
          })
          .passthrough(),
      })
      .passthrough(),

    /**
     * Jira webhook event name (for example `jira:issue_updated`).
     *
     * When present, the dispatcher allowlists it against the route `events`
     * list before the route handler runs.
     */
    webhookEvent: z.string().trim().min(1).optional(),
  })
  .passthrough()

/**
 * Validated Jira issue webhook body after
 * {@link JiraIssueWebhookPayloadSchema} succeeds.
 *
 * Derived from the schema so runtime validation and the TypeScript
 * representation remain synchronized. Extra Jira properties may still be
 * present because the schema uses passthrough.
 */
export type JiraIssueWebhookPayload = z.infer<typeof JiraIssueWebhookPayloadSchema>
