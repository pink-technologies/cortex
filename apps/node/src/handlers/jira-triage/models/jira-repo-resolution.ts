// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ResolvedJiraRepository } from './resolved-jira-repository'

/**
 * Outcome of repository resolution for a Jira triage job.
 */
export type JiraRepoResolution =
  | {
      /**
       * Discriminator for a successfully resolved repository.
       */
      readonly kind: 'resolved'

      /**
       * Repository selected for triage execution.
       */
      readonly repository: ResolvedJiraRepository
    }
  | {
      /**
       * Discriminator when no repository could be determined.
       */
      readonly kind: 'missing'
    }
  | {
      /**
       * Discriminator when multiple candidate repositories were found.
       */
      readonly kind: 'ambiguous'

      /**
       * Candidate repositories as `owner/name` slugs.
       */
      readonly repositories: readonly string[]
    }
