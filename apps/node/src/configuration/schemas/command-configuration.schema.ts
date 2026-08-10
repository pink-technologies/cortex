// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'node:path'
import { z } from 'zod'

/**
 * Maximum allowed suite timeout (one hour).
 */
export const MaximumCommandTimeoutMilliseconds = 3_600_000

/**
 * Relative working directory that cannot escape a repository root.
 */
const RelativeWorkingDirectorySchema = z
  .string()
  .trim()
  .min(1)
  .superRefine((value, context) => {
    if (path.isAbsolute(value)) {
      context.addIssue({
        code: 'custom',
        message: 'workingDirectory must be a relative path.',
      })
      return
    }

    const normalized = path.posix.normalize(value.replaceAll('\\', '/'))

    if (
      normalized === '..' ||
      normalized.startsWith('../') ||
      normalized.split('/').includes('..')
    ) {
      context.addIssue({
        code: 'custom',
        message: 'workingDirectory must not escape the repository root with "..".',
      })
    }
  })

/**
 * Validates a structured executable command used by suite runners.
 */
export const CommandConfigurationSchema = z
  .object({
    arguments: z
      .array(
        z
          .string()
          .refine((value) => !value.includes('\0'), 'Command arguments must not contain null bytes.'),
      )
      .default([]),
    executable: z.string().trim().min(1),
    timeoutMilliseconds: z
      .number()
      .int()
      .positive()
      .max(MaximumCommandTimeoutMilliseconds)
      .optional(),
    workingDirectory: RelativeWorkingDirectorySchema.default('.'),
  })
  .strict()

/**
 * Parsed structured command from project TOML.
 */
export type CommandConfigurationFile = z.infer<typeof CommandConfigurationSchema>
