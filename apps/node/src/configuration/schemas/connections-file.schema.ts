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
    apiBaseUrl: UrlWithoutTrailingSlashSchema.optional(),
    id: z.string().trim().min(1),
    provider: z.literal('github'),
    token: SecretReferenceSchema,
  })
  .strict()

/**
 * Validates one Jira connection entry in `connections.toml`.
 */
const JiraConnectionFileSchema = z
  .object({
    apiToken: SecretReferenceSchema,
    baseUrl: UrlWithoutTrailingSlashSchema,
    email: z.string().trim().pipe(z.email()),
    id: z.string().trim().min(1),
    provider: z.literal('jira'),
  })
  .strict()

/**
 * Validates `.cortex/connections.toml`.
 */
export const ConnectionsFileSchema = z
  .object({
    jiraConnections: z.array(JiraConnectionFileSchema).default([]),
    schemaVersion: z.literal(1),
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
