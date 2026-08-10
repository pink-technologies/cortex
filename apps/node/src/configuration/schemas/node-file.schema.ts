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
    /**
     * Cortex API connection settings.
     */
    api: z
      .object({
        /**
         * Complete base URL of the Cortex API, including any `/api` prefix.
         *
         * Trailing slashes are stripped after validation.
         */
        baseUrl: UrlWithoutTrailingSlashSchema,
      })
      .strict(),

    /**
     * Optional execution-engine credentials.
     */
    engines: z
      .object({
        /**
         * Cursor engine settings, when Cursor is used for execution.
         */
        cursor: z
          .object({
            /**
             * Cursor API key resolved from the environment.
             */
            apiKey: SecretReferenceSchema,
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),

    /**
     * Optional Jira automation defaults shared across projects.
     */
    jiraAutomation: z
      .object({
        /**
         * Jira account id that owns tickets Cortex should automate.
         */
        assigneeAccountId: z.string().trim().min(1).optional(),

        /**
         * Optional Jira custom field id whose value is `owner/repo` or a clone URL.
         */
        repoCustomFieldId: z.string().trim().min(1).optional(),
      })
      .strict()
      .optional(),

    /**
     * Optional host-owned language-model provider credentials.
     */
    llm: z
      .object({
        /**
         * Anthropic provider settings, when configured.
         */
        anthropic: z
          .object({
            /**
             * Anthropic API key resolved from the environment.
             */
            apiKey: SecretReferenceSchema,
          })
          .strict()
          .optional(),

        /**
         * OpenAI provider settings, when configured.
         */
        openAI: z
          .object({
            /**
             * OpenAI API key resolved from the environment.
             */
            apiKey: SecretReferenceSchema,
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),

    /**
     * Node identity and polling settings.
     */
    node: z
      .object({
        /**
         * Name of the Cortex Node.
         */
        name: z.string().trim().min(1),

        /**
         * Delay between execution-job polling attempts, in milliseconds.
         */
        pollingIntervalMilliseconds: z.number().int().positive().default(2_000),

        /**
         * Version of the Cortex Node.
         */
        version: z.string().trim().min(1),
      })
      .strict(),

    /**
     * Configuration schema version. Must be `1`.
     */
    schemaVersion: z.literal(1),
  })
  .strict()

/**
 * Parsed `.cortex/node.toml` contents.
 */
export type NodeFile = z.infer<typeof NodeFileSchema>
