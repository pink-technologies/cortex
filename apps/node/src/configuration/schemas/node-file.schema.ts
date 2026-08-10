// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { SecretReferenceSchema } from './secret-reference.schema'
import { UrlWithoutTrailingSlashSchema } from './url-without-trailing-slash.schema'

/**
 * Validates `.cortex/node.toml`.
 */
export const NodeFileSchema = z
  .object({
    api: z
      .object({
        baseUrl: UrlWithoutTrailingSlashSchema,
      })
      .strict(),
    engines: z
      .object({
        cursor: z
          .object({
            apiKey: SecretReferenceSchema,
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    jiraAutomation: z
      .object({
        assigneeAccountId: z.string().trim().min(1).optional(),
        repoCustomFieldId: z.string().trim().min(1).optional(),
      })
      .strict()
      .optional(),
    llm: z
      .object({
        anthropic: z
          .object({
            apiKey: SecretReferenceSchema,
          })
          .strict()
          .optional(),
        openAI: z
          .object({
            apiKey: SecretReferenceSchema,
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    node: z
      .object({
        name: z.string().trim().min(1),
        pollingIntervalMilliseconds: z.number().int().positive().default(2_000),
        version: z.string().trim().min(1),
      })
      .strict(),
    schemaVersion: z.literal(1),
  })
  .strict()

/**
 * Parsed `.cortex/node.toml` contents.
 */
export type NodeFile = z.infer<typeof NodeFileSchema>
