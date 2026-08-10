// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraConnection, JiraProjectRepoMapping, SourceControlConnection } from '../connection'
import type { NodeLLMConfiguration } from './llm'

/**
 * NestJS injection token for the validated, immutable
 * {@link NodeConfiguration}.
 */
export const NODE_CONFIGURATION = Symbol('NODE_CONFIGURATION')

/**
 * Validated runtime settings used by a Cortex execution node.
 *
 * Loaded from `.cortex/*.toml` via {@link NodeConfigurationLoader}. Instances
 * are frozen to prevent runtime mutation. Secrets are resolved strings; secret
 * references never appear on this model.
 */
export interface NodeConfiguration {
  // MARK: - Properties

  /**
   * Complete base URL of the Cortex API.
   *
   * Includes any deployment path or API prefix, such as
   * `http://localhost:3000/api`. Trailing slashes are stripped when the
   * configuration is created. HTTP clients must not append a hard-coded `/api`.
   */
  readonly apiBaseURL: string

  /**
   * API key used by the Cursor execution engine, when configured.
   */
  readonly cursorApiKey?: string

  /**
   * Jira account id that owns tickets Cortex should automate.
   */
  readonly jiraAutomationAssigneeAccountId?: string

  /**
   * Jira connections configured on this Node.
   */
  readonly jiraConnections: readonly JiraConnection[]

  /**
   * Project key → GitHub repo / suite map for Jira triage.
   */
  readonly jiraProjectRepos: readonly JiraProjectRepoMapping[]

  /**
   * Optional Jira custom field id whose value is `owner/repo` or a clone URL.
   */
  readonly jiraRepoCustomFieldId?: string

  /**
   * Host-owned language-model provider credentials for this node.
   *
   * See {@link NodeLLMConfiguration}. Secrets must not be exposed through
   * agent definitions, prompts, tool inputs, or execution results.
   */
  readonly llm: NodeLLMConfiguration

  /** Name of the Cortex Node. */
  readonly nodeName: string

  /** Delay between execution-job polling attempts, in milliseconds. */
  readonly pollingIntervalMilliseconds: number

  /**
   * Source-control connections configured on this Node.
   *
   * Referenced by review/triage jobs through `connectionId`. Tokens must never
   * be logged or returned in job results.
   */
  readonly sourceControlConnections: readonly SourceControlConnection[]

  /** Version of the Cortex Node. */
  readonly version: string
}
