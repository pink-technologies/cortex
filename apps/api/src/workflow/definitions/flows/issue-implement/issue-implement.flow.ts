// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  AgentExecuteJobKind,
  AgentExecuteJobPayloadSchema,
  JiraTriageJobKind,
  JiraTriageJobPayloadSchema,
  JiraTriageJobResultSchema,
  RepositoryReviewJobKind,
  RepositoryReviewJobPayloadSchema,
} from '@cortex/protocol'
import { WorkflowStepKind } from '../../../datatypes'
import type { WorkflowDefinition, WorkflowStepPayloadContext } from '../../models'
import { IssueImplementFlowDefinitionKey } from '../../keys'
import { IssueImplementFlowInputSchema } from './models'

/**
 * Builds the `jira.triage` payload for the `triage` step from the run input.
 *
 * Triage classifies and reproduces only; the `implement` step owns the fix,
 * so `attemptFix` is forced off.
 */
function buildTriagePayload(context: WorkflowStepPayloadContext): unknown {
  const input = IssueImplementFlowInputSchema.parse(context.input)

  return JiraTriageJobPayloadSchema.parse({
    connectionId: input.jiraConnectionId,
    issueKey: input.issueKey,
    options: {
      attemptFix: false,
      dryRunTests: false,
    },
    repository: input.repository,
    sourceControlConnectionId: input.sourceControlConnectionId,
  })
}

/**
 * Builds the `agent.execute` payload for the `implement` step.
 *
 * Composes the agent prompt from the run input and the `triage` step's
 * classification and reproduction outcome.
 */
function buildImplementPayload(context: WorkflowStepPayloadContext): unknown {
  const input = IssueImplementFlowInputSchema.parse(context.input)
  const triage = JiraTriageJobResultSchema.parse(context.outputs['triage'])

  const lines = [
    `Implement a fix for Jira issue ${input.issueKey} in ${input.repository.owner}/${input.repository.name}.`,
    '',
    `Classification: ${triage.classification.class} (confidence ${triage.classification.confidence}).`,
    `Rationale: ${triage.classification.rationale}`,
  ]

  if (triage.repro) {
    lines.push('', `Reproduction: ${triage.repro.status} — ${triage.repro.summary}`)

    for (const suite of triage.repro.suites) {
      lines.push(`- ${suite.suiteId}: \`${suite.command}\`${suite.exitCode === undefined ? '' : ` (exit ${suite.exitCode})`}`)
    }
  }

  lines.push('', 'Make the smallest correct change and keep the mapped tests green.')

  return AgentExecuteJobPayloadSchema.parse({
    agentId: input.agentId,
    input: lines.join('\n'),
  })
}

/**
 * Builds the `repository.review` payload for the `review` step.
 *
 * Reviews the repository's default branch in `full` mode with instructions
 * pointing the reviewer at the implemented issue.
 */
function buildReviewPayload(context: WorkflowStepPayloadContext): unknown {
  const input = IssueImplementFlowInputSchema.parse(context.input)

  return RepositoryReviewJobPayloadSchema.parse({
    change: {
      headRef: input.repository.defaultBranch,
    },
    connectionId: input.sourceControlConnectionId,
    instructions: `Review the implementation for Jira issue ${input.issueKey}.`,
    repository: {
      cloneUrl: input.repository.cloneUrl,
      name: input.repository.name,
      owner: input.repository.owner,
    },
    reviewMode: 'full',
  })
}

/**
 * Multi-step issue implement flow: Triage → Implement → Review → Approval.
 *
 * Starts from an {@link IssueImplementFlowInputSchema} input; each `JOB`
 * step's payload is built from that input plus prior step outputs, validated
 * against the protocol schema of its job kind. The final `APPROVAL` step
 * parks the run until a human decision completes or rejects it.
 *
 * Known limitation: the flow advances regardless of the triage outcome —
 * conditional gating (for example stopping when triage classifies the ticket
 * as not automation-eligible) is not supported by the step model yet.
 */
export const issueImplementFlow: WorkflowDefinition = {
  key: IssueImplementFlowDefinitionKey,
  steps: [
    {
      buildPayload: buildTriagePayload,
      key: 'triage',
      kind: WorkflowStepKind.JOB,
      jobKind: JiraTriageJobKind,
      position: 0,
    },
    {
      buildPayload: buildImplementPayload,
      key: 'implement',
      kind: WorkflowStepKind.JOB,
      jobKind: AgentExecuteJobKind,
      position: 1,
    },
    {
      buildPayload: buildReviewPayload,
      key: 'review',
      kind: WorkflowStepKind.JOB,
      jobKind: RepositoryReviewJobKind,
      position: 2,
    },
    {
      key: 'approval',
      kind: WorkflowStepKind.APPROVAL,
      position: 3,
    },
  ],
}
