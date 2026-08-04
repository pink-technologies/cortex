// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  AgentExecuteJobKind,
  JiraTriageJobKind,
  RepositoryReviewJobKind,
  type AgentExecuteJobResult,
  type JiraTriageJobResult,
  type RepositoryReviewJobResult,
} from '@cortex/protocol'
import type { IssueImplementFlowInput } from '../../src/workflow'

/**
 * Builds a valid `issue.implement.flow` start input for tests.
 */
export function issueImplementFlowInput(issueKey: string): IssueImplementFlowInput {
  return {
    agentId: 'coder',
    issueKey,
    jiraConnectionId: 'jira-main',
    repository: {
      cloneUrl: 'https://github.com/pink-tech/cortex.git',
      defaultBranch: 'main',
      name: 'cortex',
      owner: 'pink-tech',
    },
    sourceControlConnectionId: 'github-main',
  }
}

/**
 * Builds a valid `jira.triage` job result for tests.
 */
export function jiraTriageJobResult(issueKey: string): JiraTriageJobResult {
  return {
    classification: {
      automationEligible: true,
      class: 'bug',
      confidence: 0.9,
      rationale: 'Reproducible defect with mapped tests',
    },
    escalation: {
      action: 'none',
      reason: 'Automation continuing',
    },
    issueKey,
    repro: {
      status: 'reproduced',
      summary: 'Unit suite failed as described',
      suites: [],
    },
  }
}

/**
 * Builds a valid `agent.execute` job result for tests.
 */
export function agentExecuteJobResult(): AgentExecuteJobResult {
  return {
    executionId: 'execution-1',
    iterationCount: 1,
    output: 'Implemented the fix.',
    usage: {
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
    },
  }
}

/**
 * Builds a valid `repository.review` job result for tests.
 */
export function repositoryReviewJobResult(): RepositoryReviewJobResult {
  return {
    appliedPolicies: [],
    appliedSkills: ['code-review-diff'],
    decision: 'approve',
    findings: [],
    limitations: [],
    strengths: ['Implementation looks coherent.'],
    summary: 'Implementation looks correct.',
    validation: {
      notPerformed: ['Build and tests were not executed.'],
      performed: ['Inspected the prepared workspace.'],
    },
  }
}

/**
 * Returns a valid result for the given job kind of the issue-implement flow.
 *
 * @param kind - Job kind of the step being completed.
 * @param issueKey - Issue key carried through triage results.
 */
export function issueImplementResultForKind(
  kind: string,
  issueKey: string,
): JiraTriageJobResult | AgentExecuteJobResult | RepositoryReviewJobResult {
  switch (kind) {
    case JiraTriageJobKind:
      return jiraTriageJobResult(issueKey)
    case AgentExecuteJobKind:
      return agentExecuteJobResult()
    case RepositoryReviewJobKind:
      return repositoryReviewJobResult()
    default:
      throw new Error(`No issue-implement fixture result for job kind ${kind}`)
  }
}
