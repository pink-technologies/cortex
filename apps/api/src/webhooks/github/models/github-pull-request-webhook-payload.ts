// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Zod subset of a GitHub `pull_request` webhook payload used for reviews.
 */
export const GitHubPullRequestWebhookPayloadSchema = z
  .object({
    action: z.string().trim().min(1),
    pull_request: z
      .object({
        base: z
          .object({
            ref: z.string().trim().min(1),
          })
          .passthrough(),
        draft: z.boolean().optional(),
        head: z
          .object({
            ref: z.string().trim().min(1),
            sha: z.string().trim().min(1),
          })
          .passthrough(),
        number: z.number().int().positive(),
      })
      .passthrough(),
    repository: z
      .object({
        clone_url: z.url(),
        name: z.string().trim().min(1),
        owner: z
          .object({
            login: z.string().trim().min(1),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough()

/**
 * Validated GitHub pull-request webhook body.
 */
export type GitHubPullRequestWebhookPayload = z.infer<
  typeof GitHubPullRequestWebhookPayloadSchema
>
