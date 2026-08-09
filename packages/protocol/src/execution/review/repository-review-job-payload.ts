// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates the review strategy applied to a repository-review job.
 *
 * - `diff` — review only the changes between the base and head revisions
 * - `full` — review the entire repository at the head revision
 */
export const RepositoryReviewModeSchema = z.enum(['diff', 'full'])

/**
 * Validated review mode exchanged through the shared protocol.
 *
 * Derived from {@link RepositoryReviewModeSchema} so runtime validation and
 * the TypeScript representation remain synchronized.
 */
export type RepositoryReviewMode = z.infer<typeof RepositoryReviewModeSchema>

/**
 * Validates the credential-free repository reference for a review job.
 *
 * Identifies which repository to review without embedding any secrets.
 * Authentication material is resolved on the Node from the configured
 * source-control connection referenced by
 * {@link RepositoryReviewJobPayloadSchema.connectionId}.
 */
export const RepositoryReviewRepositorySchema = z
  .object({
    /**
     * Credential-free URL used to clone the repository.
     *
     * Must not contain usernames, passwords, or tokens; the Node injects
     * credentials from the referenced connection when preparing the workspace.
     */
    cloneUrl: z.url(),

    /**
     * Repository name within its owner namespace (for example `cortex`).
     */
    name: z.string().trim().min(1),

    /**
     * Owner or organization namespace of the repository (for example
     * `pink-tech`).
     */
    owner: z.string().trim().min(1),
  })
  .strict()

/**
 * Validated repository reference exchanged through the shared protocol.
 *
 * Derived from {@link RepositoryReviewRepositorySchema} so runtime validation
 * and the TypeScript representation remain synchronized.
 */
export type RepositoryReviewRepository = z.infer<typeof RepositoryReviewRepositorySchema>

/**
 * Validates the change information a review job operates on.
 *
 * Identifies the revision under review and, for diff reviews, the base
 * revision to compare against.
 */
export const RepositoryReviewChangeSchema = z
  .object({
    /**
     * Base revision the head is compared against in `diff` mode.
     *
     * Accepts a branch name, tag, or commit SHA. Omit for `full` reviews.
     */
    baseRef: z.string().trim().min(1).optional(),

    /**
     * Revision to check out and review.
     *
     * Accepts a branch name, tag, or commit SHA.
     */
    headRef: z.string().trim().min(1),

    /**
     * Provider change identifier when the review targets a proposed change
     * (for example a GitHub pull-request number).
     *
     * Used by the source-control adapter to read change metadata and publish
     * the completed review. Omit when reviewing a plain revision.
     */
    pullRequestNumber: z.number().int().positive().optional(),
  })
  .strict()

/**
 * Validated change information exchanged through the shared protocol.
 *
 * Derived from {@link RepositoryReviewChangeSchema} so runtime validation and
 * the TypeScript representation remain synchronized.
 */
export type RepositoryReviewChange = z.infer<typeof RepositoryReviewChangeSchema>

/**
 * Validates the handler-specific payload for a `repository.review` execution job.
 *
 * When an {@link ExecutionJob} has `kind` `"repository.review"`, its opaque
 * {@link ExecutionJob.payload} must satisfy this schema before a Node runs the
 * review. The schema is strict so unknown properties fail closed and surface
 * protocol drift between the API and workers.
 *
 * Field semantics:
 * - `change` — revision under review and optional diff base
 * - `connectionId` — reference to a source-control connection configured on
 *   the Node; the payload itself never carries credentials
 * - `instructions` — optional reviewer guidance forwarded to the engine
 * - `repository` — credential-free repository reference
 * - `reviewMode` — `diff` (default) or `full`
 */
export const RepositoryReviewJobPayloadSchema = z
  .object({
    /**
     * Revision under review and, for diff reviews, the base to compare
     * against.
     */
    change: RepositoryReviewChangeSchema,

    /**
     * Identifier of the source-control connection configured on the Node.
     *
     * The Node resolves this reference to authentication material and provider
     * endpoints. Credentials never travel inside the job payload.
     */
    connectionId: z.string().trim().min(1),

    /**
     * Optional reviewer guidance forwarded verbatim to the review engine.
     */
    instructions: z.string().trim().min(1).optional(),

    /**
     * Credential-free reference identifying the repository to review.
     */
    repository: RepositoryReviewRepositorySchema,

    /**
     * Review strategy for this job. Defaults to `diff` when omitted.
     */
    reviewMode: RepositoryReviewModeSchema.default('diff'),
  })
  .strict()

/**
 * Validated `repository.review` job payload exchanged through the shared protocol.
 *
 * Derived from {@link RepositoryReviewJobPayloadSchema} so runtime validation
 * and the TypeScript representation remain synchronized.
 */
export type RepositoryReviewJobPayload = z.infer<typeof RepositoryReviewJobPayloadSchema>
