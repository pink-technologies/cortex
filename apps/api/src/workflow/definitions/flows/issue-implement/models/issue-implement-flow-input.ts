// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates the credential-free repository the flow clones, implements
 * against, and reviews.
 *
 * Authentication is resolved on the Node from the source-control connection
 * referenced by {@link IssueImplementFlowInputSchema.sourceControlConnectionId}.
 */
export const IssueImplementFlowRepositorySchema = z
  .object({
    /**
     * Credential-free HTTPS clone URL.
     */
    cloneUrl: z.url(),

    /**
     * Default branch checked out for triage and reviewed at the end.
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
 * Validated flow repository reference.
 */
export type IssueImplementFlowRepository = z.infer<typeof IssueImplementFlowRepositorySchema>

/**
 * Validates the start input for the `issue.implement.flow` definition.
 *
 * The flow's step payload builders derive every child job payload from this
 * input plus prior step outputs, so starting a run with an input that fails
 * this schema is rejected at start time.
 */
export const IssueImplementFlowInputSchema = z
  .object({
    /**
     * Identifier of the Node-registered agent that implements the fix during
     * the `implement` step.
     */
    agentId: z.string().trim().min(1),

    /**
     * Jira issue key to triage and implement (for example `JC-123`).
     */
    issueKey: z.string().trim().min(1),

    /**
     * Identifier of the Jira connection configured on the Node.
     */
    jiraConnectionId: z.string().trim().min(1),

    /**
     * Repository the flow clones, implements against, and reviews.
     */
    repository: IssueImplementFlowRepositorySchema,

    /**
     * Identifier of the Node-local source-control connection used for clone,
     * test, and review work.
     */
    sourceControlConnectionId: z.string().trim().min(1),
  })
  .strict()

/**
 * Validated `issue.implement.flow` start input.
 */
export type IssueImplementFlowInput = z.infer<typeof IssueImplementFlowInputSchema>
