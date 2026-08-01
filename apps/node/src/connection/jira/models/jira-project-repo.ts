// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Maps a Jira project key to a GitHub repository and allowlisted test commands.
 */
export interface JiraProjectRepoMapping {
  /**
   * Credential-free HTTPS clone URL.
   */
  readonly cloneUrl: string

  /**
   * Default branch to check out.
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
   * Jira project key (for example `JC` from `JC-123`).
   */
  readonly projectKey: string

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
