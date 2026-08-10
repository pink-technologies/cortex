// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { SecretReferenceSchema } from './secret-reference.schema'
import { UrlWithoutTrailingSlashSchema } from './url-without-trailing-slash.schema'

/**
 * Validates one source-control connection entry in `connections.toml`.
 */
const SourceControlConnectionFileSchema = z
  .object({
    /**
     * Optional API base URL. Defaults to `https://api.github.com` for GitHub.
     */
    apiBaseUrl: UrlWithoutTrailingSlashSchema.optional(),

    /**
     * Stable identifier referenced by review and triage job payloads.
     */
    id: z.string().trim().min(1),

    /**
     * Source-control provider this connection authenticates against.
     */
    provider: z.literal('github'),

    /**
     * Authentication token resolved from the environment.
     *
     * Must never be logged or included in job results.
     */
    token: SecretReferenceSchema,
  })
  .strict()

/**
 * Validates one Jira connection entry in `connections.toml`.
 */
const JiraConnectionFileSchema = z
  .object({
    /**
     * API token paired with `email` for basic auth against Jira Cloud.
     *
     * Resolved from the environment. Must never be logged or included in job
     * results.
     */
    apiToken: SecretReferenceSchema,

    /**
     * Jira Cloud base URL (for example `https://example.atlassian.net`).
     */
    baseUrl: UrlWithoutTrailingSlashSchema,

    /**
     * Atlassian account email used for API basic auth.
     */
    email: z.string().trim().pipe(z.email()),

    /**
     * Stable identifier referenced by triage job payloads.
     */
    id: z.string().trim().min(1),

    /**
     * Jira provider discriminator.
     */
    provider: z.literal('jira'),
  })
  .strict()

/**
 * Validates `.cortex/connections.toml`.
 */
export const ConnectionsFileSchema = z
  .object({
    /**
     * Jira connections configured on this Node.
     */
    jiraConnections: z.array(JiraConnectionFileSchema).default([]),

    /**
     * Configuration schema version. Must be `1`.
     */
    schemaVersion: z.literal(1),

    /**
     * Source-control connections configured on this Node.
     */
    sourceControlConnections: z.array(SourceControlConnectionFileSchema).default([]),
  })
  .strict()
  .superRefine((connections, context) => {
    const sourceControlIds = new Set<string>()

    for (const [index, connection] of connections.sourceControlConnections.entries()) {
      if (sourceControlIds.has(connection.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate source-control connection id "${connection.id}".`,
          path: ['sourceControlConnections', index, 'id'],
        })
        continue
      }

      sourceControlIds.add(connection.id)
    }

    const jiraIds = new Set<string>()

    for (const [index, connection] of connections.jiraConnections.entries()) {
      if (jiraIds.has(connection.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate Jira connection id "${connection.id}".`,
          path: ['jiraConnections', index, 'id'],
        })
        continue
      }

      jiraIds.add(connection.id)
    }
  })

/**
 * Parsed `.cortex/connections.toml` contents.
 */
export type ConnectionsFile = z.infer<typeof ConnectionsFileSchema>
