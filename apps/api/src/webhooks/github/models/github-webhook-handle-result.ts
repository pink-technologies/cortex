// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Result returned to GitHub after processing a webhook delivery.
 */
export type GitHubWebhookHandleResult =
  | {
      /**
       * Delivery produced a new queued execution job.
       */
      readonly action: 'enqueued'

      /**
       * Identifier of the created execution job.
       */
      readonly jobId: string

      /**
       * Always `true` for a handled delivery acknowledgement.
       */
      readonly ok: true
    }
  | {
      /**
       * Delivery matched an existing enqueue idempotency key.
       */
      readonly action: 'already_enqueued'

      /**
       * Always `true` for a handled delivery acknowledgement.
       */
      readonly ok: true

      /**
       * Trigger identifier that already owns a job.
       */
      readonly reason: string
    }
  | {
      /**
       * Delivery was verified but did not enqueue work.
       */
      readonly action: 'ignored'

      /**
       * Always `true` for a handled delivery acknowledgement.
       */
      readonly ok: true

      /**
       * Machine-readable reason the delivery was ignored.
       */
      readonly reason: string
    }
