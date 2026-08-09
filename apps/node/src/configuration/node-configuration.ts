// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import type { JiraConnection, JiraProjectRepoMapping, SourceControlConnection } from '../connection'
import type { NodeLLMConfiguration } from './llm'

/**
 * NestJS injection token for the validated, immutable
 * {@link NodeConfiguration}.
 */
export const NODE_CONFIGURATION = Symbol('NODE_CONFIGURATION')

/**
 * Optional env string: missing or blank → `undefined`.
 */
const OptionalEnvStringSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}, z.string().min(1).optional())

/**
 * Validates one source-control connection entry from `CORTEX_SC_CONNECTIONS`.
 */
const SourceControlConnectionSchema = z
  .object({
    apiBaseUrl: z.string().trim().pipe(z.url()).optional(),
    id: z.string().trim().min(1),
    provider: z.literal('github'),
    token: z.string().trim().min(1),
  })
  .strict()

/**
 * Validates one Jira connection entry from `CORTEX_JIRA_CONNECTIONS`.
 */
const JiraConnectionSchema = z
  .object({
    apiToken: z.string().trim().min(1),
    baseUrl: z.string().trim().pipe(z.url()),
    email: z.string().trim().email(),
    id: z.string().trim().min(1),
    provider: z.literal('jira'),
  })
  .strict()

/**
 * Validates one named allowlisted suite entry.
 */
const JiraProjectRepoSuiteSchema = z
  .object({
    command: z.string().trim().min(1),
  })
  .strict()

/**
 * Validates one human-facing area → suite-keys mapping entry.
 */
const JiraProjectRepoAreaSchema = z
  .object({
    aliases: z.array(z.string().trim().min(1)).optional(),
    suiteKeys: z.array(z.string().trim().min(1)).min(1),
  })
  .strict()

/**
 * Validates one project→repo mapping entry from `CORTEX_JIRA_PROJECT_REPOS`.
 */
const JiraProjectRepoLeadSchema = z
  .object({
    displayName: z.string().trim().min(1).optional(),
    email: z.string().trim().pipe(z.email()),
  })
  .strict()

const JiraProjectRepoSchema = z
  .object({
    areas: z.record(z.string().trim().min(1), JiraProjectRepoAreaSchema).optional(),
    cloneUrl: z.string().trim().pipe(z.url()),
    defaultBranch: z.string().trim().min(1).default('main'),
    escalateAccountId: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1),
    owner: z.string().trim().min(1),
    projectKey: z.string().trim().min(1),
    projectLead: JiraProjectRepoLeadSchema.optional(),
    sourceControlConnectionId: z.string().trim().min(1).optional(),
    suites: z.record(z.string().trim().min(1), JiraProjectRepoSuiteSchema).optional(),
    uiTestCommand: z.string().trim().min(1).optional(),
    unitTestCommand: z.string().trim().min(1).optional(),
  })
  .strict()

/**
 * Runtime validator for environment variables required by a Cortex node.
 *
 * Numeric values are coerced from environment strings. The polling interval
 * defaults to 2,000 milliseconds when `CORTEX_POLL_INTERVAL_MS` is omitted.
 * Blank optional secrets are treated as unset.
 */
const NodeEnvironmentSchema = z.object({
  ANTHROPIC_API_KEY: OptionalEnvStringSchema,
  CORTEX_API_URL: z.string().trim().pipe(z.url()),
  CORTEX_JIRA_CONNECTIONS: OptionalEnvStringSchema,
  CORTEX_JIRA_PROJECT_REPOS: OptionalEnvStringSchema,
  CORTEX_NODE_NAME: z.string().trim().min(1),
  CORTEX_NODE_VERSION: z.string().trim().min(1),
  CORTEX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2_000),
  CORTEX_SC_CONNECTIONS: OptionalEnvStringSchema,
  CURSOR_API_KEY: OptionalEnvStringSchema,
  JIRA_AUTOMATION_ASSIGNEE_ACCOUNT_ID: OptionalEnvStringSchema,
  JIRA_REPO_CUSTOM_FIELD_ID: OptionalEnvStringSchema,
  OPENAI_API_KEY: OptionalEnvStringSchema,
})

/**
 * Validated runtime settings used by a Cortex execution node.
 *
 * This interface exposes application-friendly property names rather than raw
 * environment-variable names. Instances returned by
 * {@link createNodeConfiguration} are frozen to prevent runtime mutation.
 */
export interface NodeConfiguration {
  /**
   * Origin URL of the Cortex API process (for example `http://localhost:3000`).
   *
   * Must not include Nest’s global `/api` prefix; the Node HTTP client appends
   * it so requests land on `/api/internal/...`.
   */
  readonly apiURL: string

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
   * Project key → GitHub repo / test command map for Jira triage.
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

/**
 * Parses an optional JSON array environment variable.
 */
function parseJsonArray<T>(
  raw: string | undefined,
  schema: z.ZodType<T[]>,
  envName: string,
): T[] {
  if (!raw) {
    return []
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`${envName} must be valid JSON.`, { cause: error })
  }

  const result = schema.safeParse(parsed)

  if (!result.success) {
    throw new Error(`Invalid ${envName}:\n${z.prettifyError(result.error)}`)
  }

  return result.data
}

/**
 * Parses the optional `CORTEX_SC_CONNECTIONS` JSON array.
 */
function parseSourceControlConnections(raw: string | undefined): readonly SourceControlConnection[] {
  return parseJsonArray(raw, z.array(SourceControlConnectionSchema), 'CORTEX_SC_CONNECTIONS').map(
    (connection) => Object.freeze({ ...connection }),
  )
}

/**
 * Parses the optional `CORTEX_JIRA_CONNECTIONS` JSON array.
 */
function parseJiraConnections(raw: string | undefined): readonly JiraConnection[] {
  return parseJsonArray(raw, z.array(JiraConnectionSchema), 'CORTEX_JIRA_CONNECTIONS').map(
    (connection) =>
      Object.freeze({
        ...connection,
        baseUrl: connection.baseUrl.replace(/\/$/, ''),
      }),
  )
}

/**
 * Parses the optional `CORTEX_JIRA_PROJECT_REPOS` JSON array.
 */
function parseJiraProjectRepos(raw: string | undefined): readonly JiraProjectRepoMapping[] {
  return parseJsonArray(raw, z.array(JiraProjectRepoSchema), 'CORTEX_JIRA_PROJECT_REPOS').map(
    (mapping) => {
      const suites = mapping.suites
        ? Object.freeze(
            Object.fromEntries(
              Object.entries(mapping.suites).map(([suiteId, suite]) => [
                suiteId,
                Object.freeze({ ...suite }),
              ]),
            ),
          )
        : undefined

      const areas = mapping.areas
        ? Object.freeze(
            Object.fromEntries(
              Object.entries(mapping.areas).map(([areaId, area]) => [
                areaId,
                Object.freeze({
                  aliases: area.aliases ? Object.freeze([...area.aliases]) : undefined,
                  suiteKeys: Object.freeze([...area.suiteKeys]),
                }),
              ]),
            ),
          )
        : undefined

      return Object.freeze({
        ...mapping,
        areas,
        suites,
      })
    },
  )
}

/**
 * Parses and validates the environment configuration for a Cortex node.
 *
 * @param environment - Environment map to parse; defaults to `process.env`.
 * @returns A validated and immutable {@link NodeConfiguration}.
 * @throws {Error} When a required variable is missing or any value is invalid.
 */
export function createNodeConfiguration(environment: NodeJS.ProcessEnv = process.env): NodeConfiguration {
  const result = NodeEnvironmentSchema.safeParse(environment)

  if (!result.success) {
    throw new Error(`Invalid Cortex Node configuration:\n${z.prettifyError(result.error)}`)
  }

  const openAI = result.data.OPENAI_API_KEY
    ? Object.freeze({
        apiKey: result.data.OPENAI_API_KEY,
      })
    : undefined

  const anthropic = result.data.ANTHROPIC_API_KEY
    ? Object.freeze({
        apiKey: result.data.ANTHROPIC_API_KEY,
      })
    : undefined

  const llm = Object.freeze({
    anthropic,
    openAI,
  })

  return Object.freeze({
    apiURL: result.data.CORTEX_API_URL,
    cursorApiKey: result.data.CURSOR_API_KEY,
    jiraAutomationAssigneeAccountId: result.data.JIRA_AUTOMATION_ASSIGNEE_ACCOUNT_ID,
    jiraConnections: parseJiraConnections(result.data.CORTEX_JIRA_CONNECTIONS),
    jiraProjectRepos: parseJiraProjectRepos(result.data.CORTEX_JIRA_PROJECT_REPOS),
    jiraRepoCustomFieldId: result.data.JIRA_REPO_CUSTOM_FIELD_ID,
    llm,
    nodeName: result.data.CORTEX_NODE_NAME,
    pollingIntervalMilliseconds: result.data.CORTEX_POLL_INTERVAL_MS,
    sourceControlConnections: parseSourceControlConnections(result.data.CORTEX_SC_CONNECTIONS),
    version: result.data.CORTEX_NODE_VERSION,
  })
}
