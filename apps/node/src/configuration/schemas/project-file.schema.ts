// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { CommandConfigurationSchema } from './command-configuration.schema'
import { UrlWithoutTrailingSlashSchema } from './url-without-trailing-slash.schema'

/**
 * Validates one area → suite-keys entry in a project file.
 *
 * Area keys are the allowlisted labels a classifier may return (for example
 * `App` or `Camera`). Each area must reference suite ids declared under
 * `suites`.
 */
const ProjectAreaFileSchema = z
  .object({
    /**
     * Alternate phrases humans may use in tickets for this area.
     */
    aliases: z.array(z.string().trim().min(1)).optional(),

    /**
     * Suite ids from `suites` to run for this area.
     */
    suiteKeys: z.array(z.string().trim().min(1)).min(1),
  })
  .strict()

/**
 * Validates optional Jira escalation settings in a project file.
 */
const ProjectJiraFileSchema = z
  .object({
    /**
     * Jira account id to reassign to when escalating.
     *
     * Prefer `projectLead` (email lookup). Kept as a temporary fallback.
     */
    escalateAccountId: z.string().trim().min(1),
  })
  .strict()

/**
 * Validates optional project-lead contact fields in a project file.
 *
 * Lead email is resolved to a Jira account id at escalate time.
 */
const ProjectLeadFileSchema = z
  .object({
    /**
     * Optional display-name override for comments when Jira’s name should differ.
     */
    displayName: z.string().trim().min(1).optional(),

    /**
     * Lead email used to resolve the Jira account id at escalate time.
     */
    email: z.string().trim().pipe(z.email()),
  })
  .strict()

/**
 * Validates the repository section of a project file.
 */
const ProjectRepositoryFileSchema = z
  .object({
    /**
     * Credential-free HTTPS clone URL.
     */
    cloneUrl: UrlWithoutTrailingSlashSchema,

    /**
     * Default branch to check out.
     */
    defaultBranch: z.string().trim().min(1).default('main'),

    /**
     * Repository name within its owner namespace.
     */
    name: z.string().trim().min(1),

    /**
     * Owner or organization namespace.
     */
    owner: z.string().trim().min(1),

    /**
     * Optional Node-local GitHub connection id for clone/PR work.
     */
    sourceControlConnectionId: z.string().trim().min(1).optional(),
  })
  .strict()

/**
 * Validates one `.cortex/projects/*.toml` file.
 *
 * Same-file rules (area suite keys must exist under `suites`) are enforced
 * here. Cross-file rules (duplicate project keys, missing source-control
 * connection ids) belong in the configuration validator.
 */
export const ProjectFileSchema = z
  .object({
    /**
     * Optional area catalog used to route tickets to suite keys.
     *
     * Keys are the allowlisted labels the classifier may return (for example
     * `App`, `Camera`).
     */
    areas: z.record(z.string().trim().min(1), ProjectAreaFileSchema).optional(),

    /**
     * Optional Jira escalation settings for this project.
     */
    jira: ProjectJiraFileSchema.optional(),

    /**
     * Jira project key (for example `JC` from `JC-123`).
     */
    projectKey: z.string().trim().min(1),

    /**
     * Project lead contacted when triage needs a human.
     */
    projectLead: ProjectLeadFileSchema.optional(),

    /**
     * GitHub repository this Jira project maps to.
     */
    repository: ProjectRepositoryFileSchema,

    /**
     * Configuration schema version. Must be `1`.
     */
    schemaVersion: z.literal(1),

    /**
     * Named allowlisted suites keyed by suite id (scheme, package, etc.).
     */
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
 * Parsed `.cortex/projects/*.toml` contents.
 */
export type ProjectFile = z.infer<typeof ProjectFileSchema>
