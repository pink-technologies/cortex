// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Zod schema for the GitHub `pull_request` webhook body fields Cortex needs to
 * enqueue a repository review.
 *
 * This is a deliberate subset of GitHub's payload. Unknown properties are
 * retained via `.passthrough()` so callers can inspect additional GitHub fields
 * without failing validation. Invalid bodies map to an ignore outcome at the
 * route layer rather than an HTTP error.
 */
export const GitHubPullRequestWebhookPayloadSchema = z
  .object({
    /**
     * Pull-request action reported by GitHub (for example `opened`,
     * `synchronize`, or `ready_for_review`).
     */
    action: z.string().trim().min(1),

    /**
     * Pull request that triggered the webhook.
     */
    pull_request: z
      .object({
        /**
         * Base branch the pull request targets.
         */
        base: z
          .object({
            /**
             * Base branch name (for example `main`).
             */
            ref: z.string().trim().min(1),
          })
          .passthrough(),

        /**
         * Whether the pull request is still a draft.
         *
         * Absent values are treated as non-draft by review routing.
         */
        draft: z.boolean().optional(),

        /**
         * Head branch and revision proposed by the pull request.
         */
        head: z
          .object({
            /**
             * Head branch name.
             */
            ref: z.string().trim().min(1),

            /**
             * Head commit SHA used in review idempotency keys.
             */
            sha: z.string().trim().min(1),
          })
          .passthrough(),

        /**
         * Pull-request number within the repository.
         */
        number: z.number().int().positive(),
      })
      .passthrough(),

    /**
     * Repository that owns the pull request.
     */
    repository: z
      .object({
        /**
         * Credential-free HTTPS clone URL for the repository.
         */
        clone_url: z.url(),

        /**
         * Repository name within its owner namespace.
         */
        name: z.string().trim().min(1),

        /**
         * Owner or organization that owns the repository.
         */
        owner: z
          .object({
            /**
             * GitHub login of the repository owner.
             */
            login: z.string().trim().min(1),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough()

/**
 * Validated GitHub `pull_request` webhook body after
 * {@link GitHubPullRequestWebhookPayloadSchema} succeeds.
 *
 * Derived from the schema so runtime validation and the TypeScript
 * representation remain synchronized. Extra GitHub properties may still be
 * present because the schema uses passthrough.
 */
export type GitHubPullRequestWebhookPayload = z.infer<typeof GitHubPullRequestWebhookPayloadSchema>
