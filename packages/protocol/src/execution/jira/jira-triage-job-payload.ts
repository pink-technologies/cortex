// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates an optional credential-free GitHub repository override on a triage job.
 *
 * When present, the Node uses this clone target instead of resolving the repo
 * from Jira links or the project→repo map. Authentication still comes from a
 * Node-local source-control connection.
 */
export const JiraTriageRepositoryOverrideSchema = z
  .object({
    /**
     * Credential-free HTTPS clone URL.
     */
    cloneUrl: z.url(),

    /**
     * Default branch to check out when preparing the workspace.
     */
    defaultBranch: z.string().trim().min(1).default('main'),

    /**
     * Repository name within its owner namespace.
     */
    name: z.string().trim().min(1),

    /**
     * Owner or organization namespace of the repository.
     */
    owner: z.string().trim().min(1),
  })
  .strict()

/**
 * Validated repository override exchanged through the shared protocol.
 */
export type JiraTriageRepositoryOverride = z.infer<typeof JiraTriageRepositoryOverrideSchema>

/**
 * Validates an optional assignee filter applied before triage continues.
 *
 * When set, the Node only proceeds when the issue assignee matches.
 */
export const JiraTriageAssigneeFilterSchema = z
  .object({
    /**
     * Jira account id that must own the issue for automation to continue.
     */
    accountId: z.string().trim().min(1).optional(),

    /**
     * Jira account email that must own the issue for automation to continue.
     */
    email: z.string().trim().email().optional(),
  })
  .strict()
  .refine((value) => value.accountId !== undefined || value.email !== undefined, {
    message: 'assigneeFilter requires accountId or email',
  })

/**
 * Validated assignee filter exchanged through the shared protocol.
 */
export type JiraTriageAssigneeFilter = z.infer<typeof JiraTriageAssigneeFilterSchema>

/**
 * Validates optional runtime flags for a `jira.triage` job.
 */
export const JiraTriageJobOptionsSchema = z
  .object({
    /**
     * When true, attempt an agent fix and draft PR after a successful repro.
     *
     * Defaults to `true`.
     */
    attemptFix: z.boolean().default(true),

    /**
     * When true, stop after classify (and any escalate for ineligible tickets)
     * without resolving a repository, cloning, or running tests.
     *
     * Defaults to `false`. Useful for API↔Node classify/escalate smoke tests.
     */
    classifyOnly: z.boolean().default(false),

    /**
     * When true, report which test commands would run without executing them.
     *
     * Defaults to `false`.
     */
    dryRunTests: z.boolean().default(false),
  })
  .strict()

/**
 * Validated triage options exchanged through the shared protocol.
 */
export type JiraTriageJobOptions = z.infer<typeof JiraTriageJobOptionsSchema>

/**
 * Validates the handler-specific payload for a `jira.triage` execution job.
 *
 * Field semantics:
 * - `assigneeFilter` — optional gate on who must own the issue
 * - `connectionId` — Node-local Jira connection id (credentials never on the wire)
 * - `issueKey` — Jira issue key (for example `JC-123`)
 * - `options` — dry-run / autofix flags
 * - `repository` — optional clone target override
 * - `sourceControlConnectionId` — optional GitHub connection id for clone/PR
 */
export const JiraTriageJobPayloadSchema = z
  .object({
    /**
     * Optional assignee gate applied after reading the issue.
     */
    assigneeFilter: JiraTriageAssigneeFilterSchema.optional(),

    /**
     * Identifier of the Jira connection configured on the Node.
     */
    connectionId: z.string().trim().min(1),

    /**
     * Jira issue key to triage (for example `JC-123`).
     */
    issueKey: z.string().trim().min(1),

    /**
     * Optional runtime flags controlling tests and autofix.
     */
    options: JiraTriageJobOptionsSchema.default({
      attemptFix: true,
      classifyOnly: false,
      dryRunTests: false,
    }),

    /**
     * Optional credential-free repository override.
     */
    repository: JiraTriageRepositoryOverrideSchema.optional(),

    /**
     * Optional Node-local GitHub connection id used to clone and open PRs.
     *
     * When omitted, the Node selects a configured GitHub connection.
     */
    sourceControlConnectionId: z.string().trim().min(1).optional(),
  })
  .strict()

/**
 * Validated `jira.triage` job payload exchanged through the shared protocol.
 */
export type JiraTriageJobPayload = z.infer<typeof JiraTriageJobPayloadSchema>
