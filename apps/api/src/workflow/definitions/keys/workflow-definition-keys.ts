// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Registry key for the one-step agent execute flow.
 */
export const AgentExecuteFlowDefinitionKey = 'agent.execute.flow' as const

/**
 * Literal type for {@link AgentExecuteFlowDefinitionKey}.
 */
export type AgentExecuteFlowDefinitionKey = typeof AgentExecuteFlowDefinitionKey

/**
 * Registry key for the multi-step issue implement flow (stub until Chunk 10).
 */
export const IssueImplementFlowDefinitionKey = 'issue.implement.flow' as const

/**
 * Literal type for {@link IssueImplementFlowDefinitionKey}.
 */
export type IssueImplementFlowDefinitionKey = typeof IssueImplementFlowDefinitionKey

/**
 * Registry key for the one-step Jira triage flow.
 */
export const JiraTriageFlowDefinitionKey = 'jira.triage.flow' as const

/**
 * Literal type for {@link JiraTriageFlowDefinitionKey}.
 */
export type JiraTriageFlowDefinitionKey = typeof JiraTriageFlowDefinitionKey

/**
 * Registry key for the one-step repository review flow.
 */
export const RepositoryReviewFlowDefinitionKey = 'repository.review.flow' as const

/**
 * Literal type for {@link RepositoryReviewFlowDefinitionKey}.
 */
export type RepositoryReviewFlowDefinitionKey = typeof RepositoryReviewFlowDefinitionKey
