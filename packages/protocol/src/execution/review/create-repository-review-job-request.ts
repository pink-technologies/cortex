// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { RepositoryReviewJobPayloadSchema } from './repository-review-job-payload'

/**
 * Validates the request body used to enqueue a `repository.review` execution job.
 *
 * Accepted by the Cortex API when a caller manually requests a repository
 * review. The control plane persists an {@link ExecutionJob} with kind
 * `"repository.review"`, the supplied {@link payload}, and queue
 * {@link priority}. The schema is strict so unknown properties fail closed and
 * surface protocol drift between clients and the API.
 *
 * Field semantics:
 * - `payload` — handler-specific input validated by
 *   {@link RepositoryReviewJobPayloadSchema}
 * - `priority` — integer queue weight; higher values are preferred when Nodes
 *   claim jobs; defaults to `0` when omitted
 */
export const CreateRepositoryReviewJobRequestSchema = z
  .object({
    /**
     * Handler-specific input for the `repository.review` job.
     *
     * Must satisfy {@link RepositoryReviewJobPayloadSchema} before the job is
     * accepted into the queue.
     */
    payload: RepositoryReviewJobPayloadSchema,

    /**
     * Integer queue weight used when selecting the next available job.
     *
     * Higher values are preferred over lower ones during claim. Defaults to
     * `0` when omitted.
     */
    priority: z.number().int().default(0),
  })
  .strict()

/**
 * Validated request used to enqueue a `repository.review` execution job.
 *
 * Derived from {@link CreateRepositoryReviewJobRequestSchema} so runtime
 * validation and the TypeScript representation remain synchronized.
 */
export type CreateRepositoryReviewJobRequest = z.infer<typeof CreateRepositoryReviewJobRequestSchema>
