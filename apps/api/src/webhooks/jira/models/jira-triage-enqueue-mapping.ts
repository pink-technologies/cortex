// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraTriageJobPayload } from '@cortex/protocol'

/**
 * Outcome of mapping a Jira event into a triage enqueue request.
 */
export type JiraTriageEnqueueMapping =
  | {
      /**
       * Event should create a `jira.triage` job.
       */
      readonly kind: 'enqueue'

      /**
       * Handler-specific payload for the enqueued job.
       */
      readonly payload: JiraTriageJobPayload

      /**
       * Idempotency key derived from the issue and updated timestamp.
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
