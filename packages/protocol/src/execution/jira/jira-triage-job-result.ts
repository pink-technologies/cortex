// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Ticket classification classes produced by the QA agent.
 */
export const JiraTriageClassificationClassSchema = z.enum([
  'bug',
  'chore',
  'question',
  'out_of_scope',
])

/**
 * Validated classification class exchanged through the shared protocol.
 */
export type JiraTriageClassificationClass = z.infer<
  typeof JiraTriageClassificationClassSchema
>

/**
 * Validates the structured classification outcome for a Jira issue.
 */
export const JiraTriageClassificationSchema = z
  .object({
    /**
     * Whether Cortex automation should continue past classification.
     */
    automationEligible: z.boolean(),

    /**
     * High-level ticket class.
     */
    class: JiraTriageClassificationClassSchema,

    /**
     * Confidence in the classification, from 0 to 1 inclusive.
     */
    confidence: z.number().min(0).max(1),

    /**
     * Short human-readable rationale.
     */
    rationale: z.string().trim().min(1),
  })
  .strict()

/**
 * Validated classification exchanged through the shared protocol.
 */
export type JiraTriageClassification = z.infer<typeof JiraTriageClassificationSchema>

/**
 * Validates a single allowlisted test suite run (or dry-run) result.
 */
export const JiraTriageTestSuiteResultSchema = z
  .object({
    /**
     * Command that was (or would be) executed.
     */
    command: z.string().trim().min(1),

    /**
     * Process exit code when the suite was executed; omit for dry-run.
     */
    exitCode: z.number().int().optional(),

    /**
     * Suite identifier (`unit` or `ui`).
     */
    suiteId: z.enum(['unit', 'ui']),

    /**
     * Truncated combined stdout/stderr when available.
     */
    summary: z.string().trim().min(1).optional(),
  })
  .strict()

/**
 * Validated test suite result exchanged through the shared protocol.
 */
export type JiraTriageTestSuiteResult = z.infer<typeof JiraTriageTestSuiteResultSchema>

/**
 * Reproduction status after running (or dry-running) mapped tests.
 */
export const JiraTriageReproStatusSchema = z.enum([
  'reproduced',
  'not_reproduced',
  'skipped',
  'dry_run',
  'ambiguous_repo',
  'missing_repo',
])

/**
 * Validated repro status exchanged through the shared protocol.
 */
export type JiraTriageReproStatus = z.infer<typeof JiraTriageReproStatusSchema>

/**
 * Validates the reproduction section of a triage result.
 */
export const JiraTriageReproSchema = z
  .object({
    /**
     * Overall reproduction status.
     */
    status: JiraTriageReproStatusSchema,

    /**
     * Human-readable summary of reproduction work.
     */
    summary: z.string().trim().min(1),

    /**
     * Individual suite outcomes.
     */
    suites: z.array(JiraTriageTestSuiteResultSchema).default([]),
  })
  .strict()

/**
 * Validated reproduction outcome exchanged through the shared protocol.
 */
export type JiraTriageRepro = z.infer<typeof JiraTriageReproSchema>

/**
 * Validates the optional autofix section of a triage result.
 */
export const JiraTriageFixSchema = z
  .object({
    /**
     * Whether an agent fix was attempted.
     */
    attempted: z.boolean(),

    /**
     * Branch name used for the fix attempt, when created.
     */
    branchName: z.string().trim().min(1).optional(),

    /**
     * Draft pull-request URL when one was opened.
     */
    pullRequestUrl: z.url().optional(),

    /**
     * Whether tests were green after the fix attempt.
     */
    succeeded: z.boolean(),

    /**
     * Short summary of the fix attempt.
     */
    summary: z.string().trim().min(1).optional(),
  })
  .strict()

/**
 * Validated fix outcome exchanged through the shared protocol.
 */
export type JiraTriageFix = z.infer<typeof JiraTriageFixSchema>

/**
 * Validates the escalation action taken (or skipped) on the Jira issue.
 */
export const JiraTriageEscalationSchema = z
  .object({
    /**
     * Escalation action performed.
     */
    action: z.enum(['none', 'comment', 'reassign']),

    /**
     * Account id the issue was reassigned to, when applicable.
     */
    assigneeAccountId: z.string().trim().min(1).optional(),

    /**
     * Why escalation happened (or why it was skipped).
     */
    reason: z.string().trim().min(1),
  })
  .strict()

/**
 * Validated escalation outcome exchanged through the shared protocol.
 */
export type JiraTriageEscalation = z.infer<typeof JiraTriageEscalationSchema>

/**
 * Validates the resolved repository reference recorded on the result.
 */
export const JiraTriageResolvedRepositorySchema = z
  .object({
    cloneUrl: z.url(),
    defaultBranch: z.string().trim().min(1),
    name: z.string().trim().min(1),
    owner: z.string().trim().min(1),
    source: z.enum(['payload', 'jira_links', 'custom_field', 'project_map']),
  })
  .strict()

/**
 * Validated resolved repository exchanged through the shared protocol.
 */
export type JiraTriageResolvedRepository = z.infer<
  typeof JiraTriageResolvedRepositorySchema
>

/**
 * Validates the handler result for a completed `jira.triage` job.
 */
export const JiraTriageJobResultSchema = z
  .object({
    /**
     * Structured ticket classification.
     */
    classification: JiraTriageClassificationSchema,

    /**
     * Escalation action taken on the Jira issue.
     */
    escalation: JiraTriageEscalationSchema,

    /**
     * Optional autofix outcome.
     */
    fix: JiraTriageFixSchema.optional(),

    /**
     * Jira issue key that was triaged.
     */
    issueKey: z.string().trim().min(1),

    /**
     * Optional reproduction / test outcome.
     */
    repro: JiraTriageReproSchema.optional(),

    /**
     * Repository selected for clone/test/fix work, when resolved.
     */
    repository: JiraTriageResolvedRepositorySchema.optional(),
  })
  .strict()

/**
 * Validated `jira.triage` job result exchanged through the shared protocol.
 */
export type JiraTriageJobResult = z.infer<typeof JiraTriageJobResultSchema>
