// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { CommandConfiguration, JiraProjectRepoArea, JiraProjectRepoLead, JiraProjectRepoSuite } from '../../../connection'

/**
 * Resolved clone target for a triage job.
 */
export interface ResolvedJiraRepository {
  /**
   * Optional area → suite routing from the project map.
   */
  readonly areas?: Readonly<Record<string, JiraProjectRepoArea>>

  /**
   * Credential-free HTTPS clone URL.
   */
  readonly cloneUrl: string

  /**
   * Default branch to check out when no payload override is present.
   */
  readonly defaultBranch: string

  /**
   * Jira account id to reassign to when escalating.
   *
   * Prefer {@link projectLead} (email lookup). Kept as a temporary fallback.
   */
  readonly escalateAccountId?: string

  /**
   * Repository name within its owner namespace.
   */
  readonly name: string

  /**
   * Project lead contacted when triage needs a human.
   */
  readonly projectLead?: JiraProjectRepoLead

  /**
   * Owner or organization namespace.
   */
  readonly owner: string

  /**
   * How the repository was resolved for this issue.
   */
  readonly source: 'payload' | 'jira_links' | 'custom_field' | 'project_map'

  /**
   * Optional Node-local GitHub connection id for clone/PR work.
   */
  readonly sourceControlConnectionId?: string

  /**
   * Named allowlisted suites from the project map, when configured.
   */
  readonly suites?: Readonly<Record<string, JiraProjectRepoSuite>>
}

/**
 * Re-export for triage callers that format suite commands.
 */
export type { CommandConfiguration }
