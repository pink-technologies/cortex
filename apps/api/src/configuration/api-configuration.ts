// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * NestJS injection token for the validated, immutable
 * {@link ApiConfiguration}.
 */
export const API_CONFIGURATION = Symbol('API_CONFIGURATION')

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
 * Runtime validator for environment variables required by the Cortex API.
 *
 * `DATABASE_URL` is required. `PORT` and `REDIS_URL` have safe defaults when
 * omitted. Blank optional strings are treated as unset.
 */
const ApiEnvironmentSchema = z.object({
  DATABASE_URL: z.string().trim().pipe(z.url()),
  PORT: z.coerce.number().int().positive().default(3000),
  REDIS_URL: OptionalEnvStringSchema,
  GITHUB_WEBHOOK_SECRET: OptionalEnvStringSchema,
  GITHUB_DEFAULT_CONNECTION_ID: OptionalEnvStringSchema,
  GITHUB_REVIEW_INSTRUCTIONS: OptionalEnvStringSchema,
  JIRA_WEBHOOK_SECRET: OptionalEnvStringSchema,
  JIRA_DEFAULT_CONNECTION_ID: OptionalEnvStringSchema,
  JIRA_AUTOMATION_ASSIGNEE_ACCOUNT_ID: OptionalEnvStringSchema,
  WORKFLOW_OPERATOR_TOKEN: OptionalEnvStringSchema,
})

/**
 * Validated runtime settings used by the Cortex API process.
 *
 * Instances returned by {@link createApiConfiguration} are frozen so startup
 * configuration cannot be mutated after Nest DI wiring.
 */
export interface ApiConfiguration {
  // MARK: - Properties

  /**
   * PostgreSQL connection URL used by Prisma.
   */
  readonly databaseURL: string

  /**
   * Default source-control connection id for GitHub webhook triggers.
   */
  readonly githubDefaultConnectionId?: string

  /**
   * Optional review instructions injected into repository-review starts.
   */
  readonly githubReviewInstructions?: string

  /**
   * Shared secret for verifying GitHub webhook signatures.
   */
  readonly githubWebhookSecret?: string

  /**
   * Jira account id that owns tickets Cortex should automate.
   */
  readonly jiraAutomationAssigneeAccountId?: string

  /**
   * Default Jira connection id for Jira webhook triggers.
   */
  readonly jiraDefaultConnectionId?: string

  /**
   * Shared secret for verifying Jira webhook authenticity.
   */
  readonly jiraWebhookSecret?: string

  /**
   * HTTP listen port for the API process.
   */
  readonly port: number

  /**
   * Redis connection URL used by storage.
   */
  readonly redisURL: string

  /**
   * Bearer token required by workflow operator endpoints, when configured.
   */
  readonly workflowOperatorToken?: string
}

/**
 * Parses and validates the environment configuration for the Cortex API.
 *
 * @param environment - Environment map to parse; defaults to `process.env`.
 * @returns A validated and immutable {@link ApiConfiguration}.
 * @throws {Error} When a required variable is missing or any value is invalid.
 */
export function createApiConfiguration(environment: NodeJS.ProcessEnv = process.env): ApiConfiguration {
  const result = ApiEnvironmentSchema.safeParse(environment)

  if (!result.success) {
    throw new Error(`Invalid Cortex API configuration:\n${z.prettifyError(result.error)}`)
  }

  const redisURL = result.data.REDIS_URL ?? 'redis://localhost:6379'
  const redisURLResult = z.string().trim().pipe(z.url()).safeParse(redisURL)

  if (!redisURLResult.success) {
    throw new Error(`Invalid Cortex API configuration:\n${z.prettifyError(redisURLResult.error)}`)
  }

  return Object.freeze({
    databaseURL: result.data.DATABASE_URL,
    githubDefaultConnectionId: result.data.GITHUB_DEFAULT_CONNECTION_ID,
    githubReviewInstructions: result.data.GITHUB_REVIEW_INSTRUCTIONS,
    githubWebhookSecret: result.data.GITHUB_WEBHOOK_SECRET,
    jiraAutomationAssigneeAccountId: result.data.JIRA_AUTOMATION_ASSIGNEE_ACCOUNT_ID,
    jiraDefaultConnectionId: result.data.JIRA_DEFAULT_CONNECTION_ID,
    jiraWebhookSecret: result.data.JIRA_WEBHOOK_SECRET,
    port: result.data.PORT,
    redisURL: redisURLResult.data,
    workflowOperatorToken: result.data.WORKFLOW_OPERATOR_TOKEN,
  })
}
