// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Issue payload as returned by `GET /rest/api/3/issue/{issueKey}`.
 */
export interface JiraIssueResponse {
  /**
   * Issue fields selected for triage mapping.
   */
  readonly fields?: JiraIssueResponseFields

  /**
   * Issue key returned by Jira (for example `JC-1`).
   */
  readonly key?: string
}

/**
 * Assignee object as returned by the Jira Cloud issue REST API.
 */
export interface JiraIssueResponseAssignee {
  /**
   * Atlassian account id of the assignee when present.
   */
  readonly accountId?: string

  /**
   * Display name shown in Jira when present.
   */
  readonly displayName?: string

  /**
   * Email address associated with the assignee when present.
   */
  readonly emailAddress?: string
}

/**
 * `fields` object as returned by the Jira Cloud issue REST API.
 *
 * Known triage fields are typed explicitly. Additional keys (including
 * `customfield_*`) are accepted through the index signature.
 */
export interface JiraIssueResponseFields {
  /**
   * Current assignee, or `null` when the issue is unassigned.
   */
  readonly assignee?: JiraIssueResponseAssignee | null

  /**
   * Issue description as ADF, a plain string, or another provider shape.
   */
  readonly description?: unknown

  /**
   * Issue type metadata.
   */
  readonly issuetype?: JiraIssueResponseIssueType

  /**
   * Labels attached to the issue.
   */
  readonly labels?: string[]

  /**
   * Project that owns the issue.
   */
  readonly project?: JiraIssueResponseProject

  /**
   * Issue summary / title.
   */
  readonly summary?: string

  /**
   * Additional field values keyed by Jira field id.
   */
  readonly [key: string]: unknown
}

/**
 * Issue type object as returned by the Jira Cloud issue REST API.
 */
export interface JiraIssueResponseIssueType {
  /**
   * Issue type name (for example `Bug`).
   */
  readonly name?: string
}

/**
 * Project object as returned by the Jira Cloud issue REST API.
 */
export interface JiraIssueResponseProject {
  /**
   * Project key (for example `JC`).
   */
  readonly key?: string
}
