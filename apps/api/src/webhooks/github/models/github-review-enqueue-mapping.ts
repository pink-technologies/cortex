// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { RepositoryReviewJobPayload } from '@cortex/protocol'

/**
 * Outcome of mapping a GitHub event into a review enqueue request.
 */
export type GitHubReviewEnqueueMapping =
  | {
      /**
       * Event should create a `repository.review` job.
       */
      readonly kind: 'enqueue'

      /**
       * Handler-specific payload for the enqueued job.
       */
      readonly payload: RepositoryReviewJobPayload

      /**
       * Idempotency key derived from the pull-request head revision.
       */
      readonly triggerIdentifier: string
    }
  | {
      /**
       * Event should not enqueue work.
       */
      readonly kind: 'ignore'

      /**
       * Machine-readable reason the event was ignored.
       */
      readonly reason: string
    }
