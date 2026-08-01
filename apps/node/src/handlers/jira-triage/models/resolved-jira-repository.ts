// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Resolved clone target for a triage job.
 */
export interface ResolvedJiraRepository {
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
   */
  readonly escalateAccountId?: string

  /**
   * Repository name within its owner namespace.
   */
  readonly name: string

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
   * Allowlisted UI test command (for example Playwright).
   */
  readonly uiTestCommand?: string

  /**
   * Allowlisted unit test command.
   */
  readonly unitTestCommand?: string
}
