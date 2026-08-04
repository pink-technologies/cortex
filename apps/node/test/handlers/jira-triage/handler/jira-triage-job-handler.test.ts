// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind } from '@cortex/protocol'
import type { AgentDefinition, SkillRegistry } from '@cortex/agent-runtime'
import { JiraTriageClassifier, JiraTriageEscalator, JiraTriageJobHandler } from '../../../../src/handlers'
import type { AgentProcessResolver } from '../../../../src/agent/agent-process-resolver'
import type { ConfigJiraConnectionStore, ConfigSourceControlConnectionStore } from '../../../../src/connection'
import type { NodeConfiguration } from '../../../../src/configuration'
import type { ExecutionEngine } from '../../../../src/execution-engine'
import {
  JiraCommentResource,
  JiraIssue,
  JiraIssueAssignee,
  JiraIssueResource,
} from '@cortex/integrations/jira'
import type { GitWorkspaceManager } from '../../../../src/workspace'
import type { TestRunner } from '../../../../src/handlers/jira-triage/runner/test-runner'
import { ExecutionJobHandlerRegistry } from '../../../../src/execution/handler'

describe('jira.triage handler routing', () => {
  it('resolves the jira.triage handler from the registry', () => {
    const handler = {
      kind: JiraTriageJobKind,
      process: jest.fn(),
    }

    const registry = new ExecutionJobHandlerRegistry([handler])

    expect(registry.resolve(JiraTriageJobKind)).toBe(handler)
    expect(registry.supportedKinds()).toContain(JiraTriageJobKind)
  })
})

describe('JiraTriageJobHandler', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  function makeQaAgent(): AgentDefinition {
    return {
      id: 'qa',
      descriptor: {
        capabilities: ['jira.triage'],
        delegatesTo: [],
        name: 'QA',
        role: 'specialist',
        skills: ['ticket-classify'],
        systemPrompt: 'You are QA.',
      },
      safety: {
        allowCapabilityUse: true,
        allowDelegation: false,
        allowSkillUse: true,
        maxDelegationDepth: 0,
      },
    } as unknown as AgentDefinition
  }

  function makeHandler(overrides?: {
    readonly classify?: jest.Mock
    readonly escalate?: jest.Mock
    readonly formatComment?: jest.Mock
  }): JiraTriageJobHandler {
    const jiraConnection = {
      apiToken: 'token',
      baseUrl: 'https://example.atlassian.net',
      email: 'bot@example.com',
      id: 'jira-main',
      provider: 'jira' as const,
    }

    const classifier = {
      classify:
        overrides?.classify ??
        jest.fn().mockResolvedValue({
          automationEligible: true,
          class: 'bug',
          confidence: 0.95,
          rationale: 'Clear crash report.',
        }),
    } as unknown as JiraTriageClassifier

    const escalator = {
      escalate:
        overrides?.escalate ??
        jest.fn().mockResolvedValue({
          action: 'comment',
          reason: 'escalated',
        }),
      formatComment: overrides?.formatComment ?? jest.fn().mockReturnValue('escalation body'),
    } as unknown as JiraTriageEscalator

    return new JiraTriageJobHandler(
      {
        resolveAgent: jest.fn().mockReturnValue(makeQaAgent()),
      } as unknown as AgentProcessResolver,
      classifier,
      {
        jiraAutomationAssigneeAccountId: 'automation',
        jiraProjectRepos: [
          {
            cloneUrl: 'https://github.com/acme/app.git',
            defaultBranch: 'main',
            escalateAccountId: 'human',
            name: 'app',
            owner: 'acme',
            projectKey: 'JC',
            unitTestCommand: 'npm test',
          },
        ],
        jiraRepoCustomFieldId: undefined,
        sourceControlConnections: [{ id: 'github-main', provider: 'github', token: 'ghp' }],
      } as unknown as NodeConfiguration,
      escalator,
      {
        run: jest.fn(),
      } as unknown as ExecutionEngine,
      {
        resolve: jest.fn().mockReturnValue(jiraConnection),
      } as unknown as ConfigJiraConnectionStore,
      {
        resolve: jest.fn().mockReturnValue({ prompt: 'Classify carefully.' }),
      } as unknown as SkillRegistry,
      {} as ConfigSourceControlConnectionStore,
      {
        dryRun: jest.fn().mockReturnValue([
          { command: 'npm test', suiteId: 'unit', summary: 'dry-run' },
        ]),
        run: jest.fn(),
      } as unknown as TestRunner,
      {} as GitWorkspaceManager,
    )
  }

  it('classifies, dry-runs tests, and comments without cloning', async () => {
    const createComment = jest
      .spyOn(JiraCommentResource.prototype, 'create')
      .mockResolvedValue(undefined)
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(
      new JiraIssue(
        new JiraIssueAssignee('automation'),
        {},
        'Null pointer when saving',
        'Bug',
        'JC-9',
        ['bug'],
        'JC',
        [],
        'Crash on save',
      ),
    )

    const handler = makeHandler()

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: true },
      },
      {
        executionId: 'job-1',
        signal: new AbortController().signal,
      },
    )

    expect(result.classification.class).toBe('bug')
    expect(result.repro?.status).toBe('dry_run')
    expect(result.escalation.action).toBe('comment')
    expect(createComment).toHaveBeenCalled()
  })

  it('stops after classify when classifyOnly is true for an eligible bug', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(
      new JiraIssue(
        new JiraIssueAssignee('automation'),
        {},
        'Null pointer when saving',
        'Bug',
        'JC-10',
        ['bug'],
        'JC',
        [],
        'Crash on save',
      ),
    )

    const escalate = jest.fn()
    const handler = makeHandler({ escalate })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-10',
        options: { attemptFix: false, classifyOnly: true, dryRunTests: false },
      },
      {
        executionId: 'job-2',
        signal: new AbortController().signal,
      },
    )

    expect(result.classification.class).toBe('bug')
    expect(result.escalation).toEqual({
      action: 'none',
      reason: 'classifyOnly: stopped before repository resolution and reproduction.',
    })
    expect(result.repro).toBeUndefined()
    expect(escalate).not.toHaveBeenCalled()
  })

  it('escalates and stops when classifyOnly ticket is not automation-eligible', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(
      new JiraIssue(
        new JiraIssueAssignee('automation'),
        {},
        'Please rename a label',
        'Task',
        'JC-11',
        ['chore'],
        'JC',
        [],
        'Rename label',
      ),
    )

    const escalate = jest.fn().mockResolvedValue({
      action: 'reassign',
      assigneeAccountId: 'human',
      reason: 'Not automation-eligible.',
    })

    const handler = makeHandler({
      classify: jest.fn().mockResolvedValue({
        automationEligible: false,
        class: 'chore',
        confidence: 0.8,
        rationale: 'Maintenance request.',
      }),
      escalate,
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-11',
        options: { classifyOnly: true },
      },
      {
        executionId: 'job-3',
        signal: new AbortController().signal,
      },
    )

    expect(result.classification.class).toBe('chore')
    expect(result.escalation.action).toBe('reassign')
    expect(escalate).toHaveBeenCalled()
    expect(result.repro).toBeUndefined()
  })
})
