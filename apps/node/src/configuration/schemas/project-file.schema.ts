// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { CommandConfigurationSchema } from './command-configuration.schema'
import { UrlWithoutTrailingSlashSchema } from './url-without-trailing-slash.schema'

/**
 * Validates one human-facing area → suite-keys mapping entry.
 */
const ProjectAreaFileSchema = z
  .object({
    aliases: z.array(z.string().trim().min(1)).optional(),
    suiteKeys: z.array(z.string().trim().min(1)).min(1),
  })
  .strict()

/**
 * Validates one project file under `.cortex/projects/`.
 */
export const ProjectFileSchema = z
  .object({
    areas: z.record(z.string().trim().min(1), ProjectAreaFileSchema).optional(),
    jira: z
      .object({
        escalateAccountId: z.string().trim().min(1),
      })
      .strict()
      .optional(),
    projectKey: z.string().trim().min(1),
    projectLead: z
      .object({
        displayName: z.string().trim().min(1).optional(),
        email: z.string().trim().pipe(z.email()),
      })
      .strict()
      .optional(),
    repository: z
      .object({
        cloneUrl: UrlWithoutTrailingSlashSchema,
        defaultBranch: z.string().trim().min(1).default('main'),
        name: z.string().trim().min(1),
        owner: z.string().trim().min(1),
        sourceControlConnectionId: z.string().trim().min(1).optional(),
      })
      .strict(),
    schemaVersion: z.literal(1),
    suites: z.record(z.string().trim().min(1), CommandConfigurationSchema).optional(),
  })
  .strict()
  .superRefine((project, context) => {
    const suites = project.suites ?? {}
    const areas = project.areas ?? {}
    const suiteIds = new Set(Object.keys(suites))

    for (const [areaId, area] of Object.entries(areas)) {
      for (const [index, suiteKey] of area.suiteKeys.entries()) {
        if (!suiteIds.has(suiteKey)) {
          context.addIssue({
            code: 'custom',
            message: `Area "${areaId}" references missing suite "${suiteKey}".`,
            path: ['areas', areaId, 'suiteKeys', index],
          })
        }
      }
    }
  })

/**
 * Parsed project TOML contents.
 */
export type ProjectFile = z.infer<typeof ProjectFileSchema>
