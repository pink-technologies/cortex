// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraIssueResponse } from './jira-issue-response'
import type { JiraRemoteLinkResponse } from './jira-remote-link-response'

/**
 * Issue fields needed by Jira triage.
 *
 * Domain model mapped from Jira Cloud REST payloads. Wire shapes stay in
 * {@link JiraIssueResponse} / {@link JiraRemoteLinkResponse}; use
 * {@link JiraIssue.from} to convert them.
 */
export class JiraIssue {
  // MARK: - Properties

  /**
   * Current assignee when the issue is assigned.
   */
  readonly assignee?: JiraIssueAssignee

  /**
   * Raw custom-field values keyed by field id (for example `customfield_10001`).
   */
  readonly customFields: Readonly<Record<string, unknown>>

  /**
   * Flattened description text extracted from ADF or plain string fields.
   */
  readonly descriptionText: string

  /**
   * Jira issue type name (for example `Bug`).
   */
  readonly issueType: string

  /**
   * Issue key (for example `JC-1`).
   */
  readonly key: string

  /**
   * Labels attached to the issue.
   */
  readonly labels: readonly string[]

  /**
   * Project key derived from the issue or its key prefix.
   */
  readonly projectKey: string

  /**
   * Remote / development links associated with the issue.
   */
  readonly remoteLinks: readonly JiraIssueRemoteLink[]

  /**
   * Issue summary / title.
   */
  readonly summary: string

  // MARK: - Static methods

  /**
   * Maps transport-layer issue and remote-link responses into a domain issue.
   *
   * Missing type, project, or summary values fall back to safe defaults. Custom
   * fields are collected from keys that start with `customfield_`.
   *
   * @param response - Decoded payload from `GET /rest/api/3/issue/{issueKey}`.
   * @param remoteLinks - Already-mapped remote links for the issue.
   * @param issueKey - Requested issue key used when the payload omits `key`.
   * @returns Domain issue ready for triage.
   */
  static from(response: JiraIssueResponse, remoteLinks: readonly JiraIssueRemoteLink[], issueKey: string): JiraIssue {
    const fields = response.fields ?? {}
    const customFields: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(fields)) {
      if (key.startsWith('customfield_')) {
        customFields[key] = value
      }
    }

    const assignee = fields.assignee?.accountId
      ? new JiraIssueAssignee(fields.assignee.accountId, fields.assignee.displayName, fields.assignee.emailAddress)
      : undefined

    return new JiraIssue(
      assignee,
      customFields,
      extractJiraAdfText(fields.description),
      fields.issuetype?.name?.trim() || 'Unknown',
      response.key ?? issueKey,
      Array.isArray(fields.labels) ? fields.labels : [],
      fields.project?.key?.trim() || issueKey.split('-')[0] || issueKey,
      remoteLinks,
      fields.summary?.trim() || issueKey,
    )
  }

  // MARK: - Constructor

  /**
   * Creates a domain Jira issue.
   *
   * @param assignee - Current assignee when the issue is assigned.
   * @param customFields - Raw custom-field values keyed by field id.
   * @param descriptionText - Flattened description text.
   * @param issueType - Jira issue type name.
   * @param key - Issue key.
   * @param labels - Labels attached to the issue.
   * @param projectKey - Project key for the issue.
   * @param remoteLinks - Remote / development links.
   * @param summary - Issue summary / title.
   */
  constructor(
    assignee: JiraIssueAssignee | undefined,
    customFields: Readonly<Record<string, unknown>>,
    descriptionText: string,
    issueType: string,
    key: string,
    labels: readonly string[],
    projectKey: string,
    remoteLinks: readonly JiraIssueRemoteLink[],
    summary: string,
  ) {
    this.assignee = assignee
    this.customFields = customFields
    this.descriptionText = descriptionText
    this.issueType = issueType
    this.key = key
    this.labels = labels
    this.projectKey = projectKey
    this.remoteLinks = remoteLinks
    this.summary = summary
  }
}

/**
 * Assignee information on a Jira issue.
 */
export class JiraIssueAssignee {
  // MARK: - Properties

  /**
   * Atlassian account id of the assignee.
   */
  readonly accountId: string

  /**
   * Display name shown in Jira when available.
   */
  readonly displayName?: string

  /**
   * Email address associated with the assignee when available.
   */
  readonly emailAddress?: string

  // MARK: - Constructor

  /**
   * Creates an issue assignee.
   *
   * @param accountId - Atlassian account id of the assignee.
   * @param displayName - Display name shown in Jira when available.
   * @param emailAddress - Email address when available.
   */
  constructor(accountId: string, displayName?: string, emailAddress?: string) {
    this.accountId = accountId
    this.displayName = displayName
    this.emailAddress = emailAddress
  }
}

/**
 * Remote / development link that may point at a GitHub repository.
 */
export class JiraIssueRemoteLink {
  // MARK: - Properties

  /**
   * Optional link title from Jira.
   */
  readonly title?: string

  /**
   * Absolute URL of the remote resource.
   */
  readonly url: string

  // MARK: - Static methods

  /**
   * Maps a remote-link REST entry into a domain link.
   *
   * @param response - Decoded `remotelink` payload entry.
   * @returns Domain remote link, or `undefined` when the entry has no URL.
   */
  static from(response: JiraRemoteLinkResponse): JiraIssueRemoteLink | undefined {
    const url = response.object?.url?.trim()
    if (!url) {
      return undefined
    }

    return new JiraIssueRemoteLink(url, response.object?.title)
  }

  // MARK: - Constructor

  /**
   * Creates a remote link.
   *
   * @param url - Absolute URL of the remote resource.
   * @param title - Optional link title from Jira.
   */
  constructor(url: string, title?: string) {
    this.url = url
    this.title = title
  }
}

/**
 * Flattens Jira ADF (or plain string) description into readable text.
 */
function extractJiraAdfText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (!value || typeof value !== 'object') {
    return ''
  }

  const texts: string[] = []

  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') {
      return
    }

    const record = node as { text?: unknown; content?: unknown }
    if (typeof record.text === 'string') {
      texts.push(record.text)
    }

    if (Array.isArray(record.content)) {
      for (const child of record.content) {
        visit(child)
      }
    }
  }

  visit(value)
  return texts.join(' ').replace(/\s+/g, ' ').trim()
}
