// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Discriminator value for execution jobs that triage a Jira issue.
 *
 * Set as {@link ExecutionJob.kind} when enqueueing or claiming Jira triage.
 * Workers switch on this constant to validate
 * {@link ExecutionJob.payload} with {@link JiraTriageJobPayloadSchema}
 * and to interpret the job outcome as {@link JiraTriageJobResultSchema}.
 *
 * Prefer comparing against this export instead of hard-coding `"jira.triage"`
 * so renames and refactors stay type-safe across API and Node packages.
 */
export const JiraTriageJobKind = 'jira.triage' as const

/**
 * Literal job-kind type for Jira triage (`"jira.triage"`).
 *
 * Derived from {@link JiraTriageJobKind} so the compile-time union member
 * stays aligned with the runtime constant.
 */
export type JiraTriageJobKind = typeof JiraTriageJobKind
