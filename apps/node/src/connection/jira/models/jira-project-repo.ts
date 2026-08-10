// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { CommandConfiguration } from './command-configuration'

/**
 * One allowlisted reproduction suite for a Jira project→repo mapping.
 */
export type JiraProjectRepoSuite = CommandConfiguration

/**
 * Human-facing product area that maps to one or more allowlisted suites.
 */
export interface JiraProjectRepoArea {
  /**
   * Alternate phrases humans may use in tickets for this area.
   */
  readonly aliases?: readonly string[]

  /**
   * Suite ids from {@link JiraProjectRepoMapping.suites} to run for this area.
   */
  readonly suiteKeys: readonly string[]
}

/**
 * Project lead contacted when triage needs a human (looked up by email).
 */
export interface JiraProjectRepoLead {
  /**
   * Optional display-name override for comments when Jira’s name should differ.
   */
  readonly displayName?: string

  /**
   * Lead email used to resolve the Jira account id at escalate time.
   */
  readonly email: string
}

/**
 * Maps a Jira project key to a GitHub repository and allowlisted suites.
 */
export interface JiraProjectRepoMapping {
  /**
   * Optional area catalog used to route tickets to suite keys.
   *
   * Keys are the allowlisted labels the classifier may return (for example
   * `App`, `Camera`).
   */
  readonly areas?: Readonly<Record<string, JiraProjectRepoArea>>

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
   *
   * Prefer {@link projectLead} (email lookup). Kept as a temporary fallback.
   */
  readonly escalateAccountId?: string

  /**
   * Project lead resolved by email for @-mention and reassignment.
   */
  readonly projectLead?: JiraProjectRepoLead

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
   * Named allowlisted suites keyed by suite id (scheme, package, etc.).
   */
  readonly suites?: Readonly<Record<string, JiraProjectRepoSuite>>
}
