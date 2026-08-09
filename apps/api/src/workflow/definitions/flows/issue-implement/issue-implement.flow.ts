// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowStepKind } from '../../../datatypes'
import type { WorkflowDefinition, WorkflowStepPayloadContext } from '../../models'
import { IssueImplementFlowInputSchema, type IssueImplementFlowInput } from './models'
import {
  buildIssueImplementationInstructions,
  renderIssueImplementationInstructions,
} from './prompts'

import {
  AgentExecuteJobKind,
  AgentExecuteJobPayloadSchema,
  JiraTriageJobKind,
  JiraTriageJobPayloadSchema,
  JiraTriageJobResultSchema,
  RepositoryReviewJobKind,
  RepositoryReviewJobPayloadSchema,
  type JiraTriageJobResult,
} from '@cortex/protocol'

/**
 * Stable step keys for {@link issueImplementFlow}.
 *
 * Use these literals for definition steps and when reading
 * {@link WorkflowStepPayloadContext.outputs} so builders cannot drift from the
 * registered keys.
 */
export const IssueImplementFlowStepKey = {
  TRIAGE: 'triage',
  IMPLEMENT: 'implement',
  REVIEW: 'review',
  APPROVAL: 'approval',
} as const

/**
 * Parses the run start input from an untrusted payload context.
 *
 * @param context - Activation context whose `input` must satisfy
 *   {@link IssueImplementFlowInputSchema}.
 * @returns Validated flow start input.
 * @throws {ZodError} When `context.input` fails schema validation.
 */
function parseInput(context: WorkflowStepPayloadContext): IssueImplementFlowInput {
  return IssueImplementFlowInputSchema.parse(context.input)
}

/**
 * Parses the triage step result from an untrusted payload context.
 *
 * Reads {@link IssueImplementFlowStepKey.TRIAGE} from `context.outputs`.
 *
 * @param context - Activation context after the triage step has completed.
 * @returns Validated {@link JiraTriageJobResult}.
 * @throws {ZodError} When the triage output is missing or malformed.
 */
function parseTriageResult(context: WorkflowStepPayloadContext): JiraTriageJobResult {
  return JiraTriageJobResultSchema.parse(context.outputs[IssueImplementFlowStepKey.TRIAGE])
}

/**
 * Builds a triage payload that classifies and reproduces without applying
 * repository changes.
 *
 * @param context - Run input and prior step outputs at activation.
 * @returns Validated `jira.triage` job payload.
 */
function buildTriagePayload(context: WorkflowStepPayloadContext): unknown {
  const input = parseInput(context)

  return JiraTriageJobPayloadSchema.parse({
    connectionId: input.jiraConnectionId,
    issueKey: input.issueKey,
    repository: input.repository,
    sourceControlConnectionId: input.sourceControlConnectionId,
    options: {
      attemptFix: false,
      classifyOnly: false,
      dryRunTests: false,
    },
  })
}

/**
 * Builds an agent-execute payload from the flow input and triage result.
 *
 * Composes structured instructions, renders them to the string required by
 * {@link AgentExecuteJobPayloadSchema}, and preserves the configured agent id.
 *
 * @param context - Run input and prior step outputs at activation.
 * @returns Validated `agent.execute` job payload.
 */
function buildImplementationPayload(context: WorkflowStepPayloadContext): unknown {
  const input = parseInput(context)
  const triage = parseTriageResult(context)
  const instructions = buildIssueImplementationInstructions(input, triage)

  return AgentExecuteJobPayloadSchema.parse({
    agentId: input.agentId,
    input: renderIssueImplementationInstructions(instructions),
  })
}

/**
 * Builds a repository-review payload for the implemented change.
 *
 * Until `agent.execute` results carry a branch or commit, `change.headRef`
 * falls back to the repository default branch. Wire the implementation
 * output into that field once the protocol exposes it.
 *
 * @param context - Run input and prior step outputs at activation.
 * @returns Validated `repository.review` job payload.
 */
function buildReviewPayload(context: WorkflowStepPayloadContext): unknown {
  const input = parseInput(context)

  return RepositoryReviewJobPayloadSchema.parse({
    connectionId: input.sourceControlConnectionId,
    instructions: `Review the implementation for Jira issue ${input.issueKey}.`,
    reviewMode: 'full',
    change: {
      headRef: input.repository.defaultBranch,
    },
    repository: {
      cloneUrl: input.repository.cloneUrl,
      name: input.repository.name,
      owner: input.repository.owner,
    },
  })
}

/**
 * Implements a Jira issue through triage, implementation, repository review,
 * and final human approval.
 *
 * Conditional routing is not yet supported. Until it is, triage outcomes that
 * are not automation-eligible must be handled before implementation.
 */
export const issueImplementFlow = {
  key: 'issue.implement.flow',
  version: 1,
  steps: [
    {
      buildPayload: buildTriagePayload,
      key: IssueImplementFlowStepKey.TRIAGE,
      kind: WorkflowStepKind.JOB,
      jobKind: JiraTriageJobKind,
      position: 0,
    },
    {
      buildPayload: buildImplementationPayload,
      key: IssueImplementFlowStepKey.IMPLEMENT,
      kind: WorkflowStepKind.JOB,
      jobKind: AgentExecuteJobKind,
      position: 1,
    },
    {
      buildPayload: buildReviewPayload,
      key: IssueImplementFlowStepKey.REVIEW,
      kind: WorkflowStepKind.JOB,
      jobKind: RepositoryReviewJobKind,
      position: 2,
    },
    {
      key: IssueImplementFlowStepKey.APPROVAL,
      kind: WorkflowStepKind.APPROVAL,
      position: 3,
    },
  ],
} satisfies WorkflowDefinition
