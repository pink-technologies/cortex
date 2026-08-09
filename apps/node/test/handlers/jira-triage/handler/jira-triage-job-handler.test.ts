// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind } from '@cortex/protocol'
import {
  JiraTriageClassifier,
  JiraTriageEscalator,
  JiraTriageFixAttempter,
  JiraTriageJobHandler,
  JiraTriageReproAttempter,
  JiraTriageReproductionError,
} from '../../../../src/handlers'
import type { ConfigJiraConnectionStore, ConfigSourceControlConnectionStore } from '../../../../src/connection'
import type { NodeConfiguration } from '../../../../src/configuration'
import {
  JiraCommentResource,
  JiraIssue,
  JiraIssueAssignee,
  JiraIssueResource,
  JiraUserResource,
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
  beforeEach(() => {
    jest.spyOn(JiraCommentResource.prototype, 'create').mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function makeEligibleBug(): JiraIssue {
    return new JiraIssue(
      new JiraIssueAssignee('automation'),
      {},
      'Null pointer when saving',
      'Bug',
      'JC-9',
      ['bug'],
      'JC',
      [],
      'Crash on save',
    )
  }

  function makeHandler(overrides?: {
    readonly attemptFix?: jest.Mock
    readonly attemptRepro?: jest.Mock
    readonly classify?: jest.Mock
    readonly escalate?: jest.Mock
    readonly formatFinishComment?: jest.Mock
    readonly formatStartComment?: jest.Mock
    readonly prepare?: jest.Mock
    readonly cleanup?: jest.Mock
    readonly dryRun?: jest.Mock
    readonly projectLead?: { readonly displayName?: string; readonly email: string }
    readonly runSuites?: jest.Mock
    readonly resolveSourceControl?: jest.Mock
  }): {
    readonly attemptFix: jest.Mock
    readonly attemptRepro: jest.Mock
    readonly cleanup: jest.Mock
    readonly escalate: jest.Mock
    readonly formatFinishComment: jest.Mock
    readonly handler: JiraTriageJobHandler
    readonly prepare: jest.Mock
    readonly runSuites: jest.Mock
  } {
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

    const escalate =
      overrides?.escalate ??
      jest.fn().mockResolvedValue({
        action: 'reassign',
        assigneeAccountId: 'human',
        reason: 'escalated',
      })

    const formatFinishComment =
      overrides?.formatFinishComment ?? jest.fn().mockReturnValue('finish body')

    const escalator = {
      escalate,
      formatFinishComment,
      formatStartComment:
        overrides?.formatStartComment ?? jest.fn().mockReturnValue('start body'),
    } as unknown as JiraTriageEscalator

    const attemptFix = overrides?.attemptFix ?? jest.fn()
    const attemptRepro =
      overrides?.attemptRepro ??
      jest.fn().mockResolvedValue({
        attempted: true,
        branchName: 'cortex/jira-repro-jc-9-1',
        committed: false,
        summary: 'Agent produced no commit while authoring regression tests.',
      })
    const prepare =
      overrides?.prepare ?? jest.fn().mockResolvedValue({ path: '/tmp/cortex-workspace/repo' })
    const cleanup = overrides?.cleanup ?? jest.fn().mockResolvedValue(undefined)
    const dryRun =
      overrides?.dryRun ??
      jest.fn().mockReturnValue([{ command: 'npm test', suiteId: 'unit', summary: 'dry-run' }])
    const runSuites = overrides?.runSuites ?? jest.fn().mockResolvedValue([])

    const handler = new JiraTriageJobHandler(
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
            projectLead: overrides?.projectLead,
            unitTestCommand: 'npm test',
          },
        ],
        jiraRepoCustomFieldId: undefined,
        sourceControlConnections: [{ id: 'github-main', provider: 'github', token: 'ghp' }],
      } as unknown as NodeConfiguration,
      escalator,
      { attempt: attemptFix } as unknown as JiraTriageFixAttempter,
      {
        resolve: jest.fn().mockReturnValue(jiraConnection),
      } as unknown as ConfigJiraConnectionStore,
      { attempt: attemptRepro } as unknown as JiraTriageReproAttempter,
      {
        resolve:
          overrides?.resolveSourceControl ??
          jest.fn().mockReturnValue({ id: 'github-main', provider: 'github', token: 'ghp' }),
      } as unknown as ConfigSourceControlConnectionStore,
      {
        dryRun,
        run: runSuites,
      } as unknown as TestRunner,
      {
        cleanup,
        prepare,
      } as unknown as GitWorkspaceManager,
    )

    return {
      attemptFix,
      attemptRepro,
      cleanup,
      escalate,
      formatFinishComment,
      handler,
      prepare,
      runSuites,
    }
  }

  it('classifies, dry-runs tests, and comments without cloning', async () => {
    const createComment = jest
      .spyOn(JiraCommentResource.prototype, 'create')
      .mockResolvedValue(undefined)
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const { handler, prepare } = makeHandler({
      escalate: jest.fn().mockResolvedValue({
        action: 'comment',
        reason: 'Dry-run completed; no escalation reassignment.',
      }),
    })

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
    expect(result.classification.automationEligible).toBe(true)
    expect(result.repro?.status).toBe('dry_run')
    expect(result.escalation.action).toBe('comment')
    expect(createComment).toHaveBeenCalled()
    expect(prepare).not.toHaveBeenCalled()
  })

  it('stops after classify when classifyOnly is true for a bug', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const escalate = jest.fn()
    const { handler, prepare } = makeHandler({ escalate })

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
      action: 'comment',
      reason: 'classifyOnly: stopped before repository resolution and reproduction.',
    })
    expect(result.repro).toBeUndefined()
    expect(escalate).not.toHaveBeenCalled()
    expect(prepare).not.toHaveBeenCalled()
  })

  it('escalates and stops when ticket is not a bug', async () => {
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
      action: 'comment',
      reason: 'Not a bug.',
    })

    const { handler, prepare } = makeHandler({
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

    expect(result.classification).toEqual({
      automationEligible: false,
      class: 'chore',
      confidence: 0.8,
      rationale: 'Maintenance request.',
    })
    expect(result.escalation.action).toBe('comment')
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Not a bug.',
        reassign: false,
      }),
    )
    expect(result.repro).toBeUndefined()
    expect(prepare).not.toHaveBeenCalled()
  })

  it('honors assigneeFilter email when gating triage', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(
      new JiraIssue(
        new JiraIssueAssignee('automation', 'Bot', 'bot@example.com'),
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

    const escalate = jest.fn().mockResolvedValue({
      action: 'comment',
      reason: 'Assignee gate failed.',
    })
    const { handler, prepare } = makeHandler({ escalate })

    const result = await handler.process(
      {
        assigneeFilter: { email: 'other@example.com' },
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: true },
      },
      {
        executionId: 'job-email-gate',
        signal: new AbortController().signal,
      },
    )

    expect(prepare).not.toHaveBeenCalled()
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Assignee gate failed.',
        reassign: false,
      }),
    )
    expect(result.repro).toBeUndefined()
  })

  it('escalates without reassign when the assignee gate fails', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(
      new JiraIssue(
        new JiraIssueAssignee('someone-else'),
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

    const escalate = jest.fn().mockResolvedValue({
      action: 'comment',
      reason: 'Assignee gate failed.',
    })
    const { handler, prepare } = makeHandler({ escalate })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-assignee-gate',
        signal: new AbortController().signal,
      },
    )

    expect(prepare).not.toHaveBeenCalled()
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Assignee gate failed.',
        reassign: false,
      }),
    )
    expect(result.repro).toBeUndefined()
  })

  it('escalates skipped when the mapped repo has no allowlisted suites', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const escalate = jest.fn().mockResolvedValue({
      action: 'reassign',
      reason: 'Repository mapping has no allowlisted unit/UI test commands.',
    })

    const classifier = {
      classify: jest.fn().mockResolvedValue({
        automationEligible: true,
        class: 'bug',
        confidence: 0.95,
        rationale: 'Clear crash report.',
      }),
    } as unknown as JiraTriageClassifier

    const handler = new JiraTriageJobHandler(
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
          },
        ],
        jiraRepoCustomFieldId: undefined,
        sourceControlConnections: [{ id: 'github-main', provider: 'github', token: 'ghp' }],
      } as unknown as NodeConfiguration,
      {
        escalate,
        formatFinishComment: jest.fn().mockReturnValue('body'),
        formatStartComment: jest.fn().mockReturnValue('start'),
      } as unknown as JiraTriageEscalator,
      { attempt: jest.fn() } as unknown as JiraTriageFixAttempter,
      {
        resolve: jest.fn().mockReturnValue({
          apiToken: 'token',
          baseUrl: 'https://example.atlassian.net',
          email: 'bot@example.com',
          id: 'jira-main',
          provider: 'jira',
        }),
      } as unknown as ConfigJiraConnectionStore,
      { attempt: jest.fn() } as unknown as JiraTriageReproAttempter,
      {
        resolve: jest.fn().mockReturnValue({ id: 'github-main', provider: 'github', token: 'ghp' }),
      } as unknown as ConfigSourceControlConnectionStore,
      { dryRun: jest.fn(), run: jest.fn() } as unknown as TestRunner,
      { cleanup: jest.fn(), prepare: jest.fn() } as unknown as GitWorkspaceManager,
    )

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-no-suites',
        signal: new AbortController().signal,
      },
    )

    expect(result.repro?.status).toBe('skipped')
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Repository mapping has no allowlisted test suites.',
      }),
    )
  })

  it('escalates missing_repo when the project has no GitHub mapping', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(
      new JiraIssue(
        new JiraIssueAssignee('automation'),
        {},
        'Null pointer when saving',
        'Bug',
        'ZZ-1',
        ['bug'],
        'ZZ',
        [],
        'Crash on save',
      ),
    )

    const escalate = jest.fn().mockResolvedValue({
      action: 'reassign',
      reason: 'No GitHub repository mapping for this ticket.',
    })
    const { handler, prepare } = makeHandler({ escalate })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'ZZ-1',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-missing-repo',
        signal: new AbortController().signal,
      },
    )

    expect(prepare).not.toHaveBeenCalled()
    expect(result.classification.automationEligible).toBe(true)
    expect(result.repro?.status).toBe('missing_repo')
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'No GitHub repository mapping for this ticket.',
        reassign: true,
      }),
    )
  })

  it('clones for bugs even when the classifier set automationEligible false', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const { attemptRepro, handler, prepare, runSuites } = makeHandler({
      classify: jest.fn().mockResolvedValue({
        automationEligible: false,
        class: 'bug',
        confidence: 0.9,
        rationale: 'Bug but model guessed ineligible.',
      }),
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: '1 failing',
        },
      ]),
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-eligible-evidence',
        signal: new AbortController().signal,
      },
    )

    expect(prepare).toHaveBeenCalled()
    expect(runSuites).toHaveBeenCalled()
    expect(attemptRepro).not.toHaveBeenCalled()
    expect(result.classification.automationEligible).toBe(true)
    expect(result.repro?.status).toBe('reproduced')
  })

  it('escalates suite_broken without fill-tests or fix when suites do not compile', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const { attemptFix, attemptRepro, escalate, handler, runSuites } = makeHandler({
      attemptFix: jest.fn().mockResolvedValue({
        attempted: true,
        succeeded: false,
        summary: 'should not run',
      }),
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'xcodebuild test -scheme TruVideoSdkCore',
          exitCode: 65,
          suiteId: 'TruVideoSdkCore',
          summary: 'error: cannot find type Foo in scope\n** BUILD FAILED **',
        },
      ]),
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: true, dryRunTests: false },
      },
      {
        executionId: 'job-suite-broken',
        signal: new AbortController().signal,
      },
    )

    expect(runSuites).toHaveBeenCalledTimes(1)
    expect(attemptRepro).not.toHaveBeenCalled()
    expect(attemptFix).not.toHaveBeenCalled()
    expect(result.repro?.status).toBe('suite_broken')
    expect(result.fix).toBeUndefined()
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason:
          'Allowlisted suite(s) failed before tests could run (build or environment). Autofix skipped.',
        reassign: true,
      }),
    )
  })

  it('clones and reports reproduced when suites fail with attemptFix false', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const { attemptFix, attemptRepro, cleanup, escalate, handler, prepare, runSuites } = makeHandler({
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: 'FAIL unit.test.ts\nExpected: 1\nReceived: 2',
        },
      ]),
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-4',
        signal: new AbortController().signal,
      },
    )

    expect(prepare).toHaveBeenCalled()
    expect(runSuites).toHaveBeenCalledTimes(1)
    expect(attemptRepro).not.toHaveBeenCalled()
    expect(attemptFix).not.toHaveBeenCalled()
    expect(result.repro?.status).toBe('reproduced')
    expect(result.fix).toBeUndefined()
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Bug reproduced; autofix disabled.',
        reassign: true,
      }),
    )
    expect(cleanup).toHaveBeenCalledWith({ path: '/tmp/cortex-workspace/repo' })
  })

  it('treats missing suite exit codes as success and attempts test authoring', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const { attemptRepro, handler } = makeHandler({
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          suiteId: 'unit',
          summary: 'pass',
        },
      ]),
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-missing-exit',
        signal: new AbortController().signal,
      },
    )

    expect(attemptRepro).toHaveBeenCalled()
    expect(result.repro?.status).toBe('not_reproduced')
  })

  it('records test authoring without a commit when the agent leaves the tree clean', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const { attemptRepro, escalate, handler } = makeHandler({
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 0,
          suiteId: 'unit',
          summary: 'pass',
        },
      ]),
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-no-repro-commit',
        signal: new AbortController().signal,
      },
    )

    expect(attemptRepro).toHaveBeenCalled()
    expect(result.repro?.summary).toContain('Test authoring attempted')
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Could not reproduce the reported bug with mapped tests after test authoring.',
      }),
    )
  })

  it('authors tests then escalates suite_broken when the second run does not compile', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const runSuites = jest
      .fn()
      .mockResolvedValueOnce([
        {
          command: 'npm test',
          exitCode: 0,
          suiteId: 'unit',
          summary: 'pass',
        },
      ])
      .mockResolvedValueOnce([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: 'npm ERR! code ENOENT\nnpm ERR! path /tmp/repo/package.json',
        },
      ])

    const { attemptFix, attemptRepro, escalate, handler } = makeHandler({
      attemptRepro: jest.fn().mockResolvedValue({
        branchName: 'cortex/jc-9-repro',
        committed: true,
        summary: 'Added a failing regression test.',
      }),
      runSuites,
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: true, dryRunTests: false },
      },
      {
        executionId: 'job-suite-broken-after-authoring',
        signal: new AbortController().signal,
      },
    )

    expect(attemptRepro).toHaveBeenCalled()
    expect(attemptFix).not.toHaveBeenCalled()
    expect(runSuites).toHaveBeenCalledTimes(2)
    expect(result.repro?.status).toBe('suite_broken')
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason:
          'Allowlisted suite(s) failed before tests could run after test authoring. Autofix skipped.',
        reassign: true,
      }),
    )
  })

  it('authors tests then escalates not_reproduced when suites stay green', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const runSuites = jest.fn().mockResolvedValue([
      {
        command: 'npm test',
        exitCode: 0,
        suiteId: 'unit',
        summary: 'pass',
      },
    ])

    const { attemptFix, attemptRepro, escalate, handler } = makeHandler({
      attemptRepro: jest.fn().mockResolvedValue({
        attempted: true,
        branchName: 'cortex/jira-repro-jc-9-1',
        committed: true,
        summary: 'Added null-guard regression.',
      }),
      runSuites,
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-5',
        signal: new AbortController().signal,
      },
    )

    expect(attemptRepro).toHaveBeenCalled()
    expect(runSuites).toHaveBeenCalledTimes(2)
    expect(attemptFix).not.toHaveBeenCalled()
    expect(result.repro?.status).toBe('not_reproduced')
    expect(result.repro?.summary).toContain('Test authoring committed')
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Could not reproduce the reported bug with mapped tests after test authoring.',
      }),
    )
  })

  it('authors tests then autofixes when the second suite run fails', async () => {
    const createComment = jest
      .spyOn(JiraCommentResource.prototype, 'create')
      .mockResolvedValue(undefined)
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const workspace = { path: '/tmp/cortex-workspace/repo' }
    const runSuites = jest
      .fn()
      .mockResolvedValueOnce([
        {
          command: 'npm test',
          exitCode: 0,
          suiteId: 'unit',
          summary: 'pass',
        },
      ])
      .mockResolvedValueOnce([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: 'new regression failing',
        },
      ])

    const { attemptFix, attemptRepro, escalate, handler } = makeHandler({
      prepare: jest.fn().mockResolvedValue(workspace),
      runSuites,
      attemptRepro: jest.fn().mockResolvedValue({
        attempted: true,
        branchName: 'cortex/jira-repro-jc-9-1',
        committed: true,
        summary: 'Added failing regression.',
      }),
      attemptFix: jest.fn().mockResolvedValue({
        attempted: true,
        branchName: 'cortex/jira-jc-9-1',
        pullRequestUrl: 'https://github.com/acme/app/pull/9',
        succeeded: true,
        summary: 'Patched null guard.',
      }),
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: true, dryRunTests: false },
      },
      {
        executionId: 'job-fill-then-fix',
        signal: new AbortController().signal,
      },
    )

    expect(attemptRepro).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace,
        suites: { unit: 'npm test' },
      }),
    )
    expect(runSuites).toHaveBeenCalledTimes(2)
    expect(attemptFix).toHaveBeenCalledWith(
      expect.objectContaining({
        failingSummary: 'new regression failing',
        workspace,
      }),
    )
    expect(createComment).toHaveBeenCalled()
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        issueKey: 'JC-9',
        reason: 'Fix succeeded; draft PR linked on the ticket.',
        reassign: false,
      }),
    )
    expect(result.repro?.status).toBe('reproduced')
    expect(result.fix?.succeeded).toBe(true)
  })

  it('maps workspace prepare failures to JiraTriageReproductionError', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const { cleanup, handler } = makeHandler({
      prepare: jest.fn().mockRejectedValue(new Error('clone failed')),
    })

    await expect(
      handler.process(
        {
          connectionId: 'jira-main',
          issueKey: 'JC-9',
          options: { attemptFix: false, dryRunTests: false },
        },
        {
          executionId: 'job-6',
          signal: new AbortController().signal,
        },
      ),
    ).rejects.toBeInstanceOf(JiraTriageReproductionError)

    expect(cleanup).not.toHaveBeenCalled()
  })

  it('maps suite runner failures to JiraTriageReproductionError', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const { cleanup, handler } = makeHandler({
      runSuites: jest.fn().mockRejectedValue(new Error('spawn failed')),
    })

    await expect(
      handler.process(
        {
          connectionId: 'jira-main',
          issueKey: 'JC-9',
          options: { attemptFix: false, dryRunTests: false },
        },
        {
          executionId: 'job-suite-fail',
          signal: new AbortController().signal,
        },
      ),
    ).rejects.toBeInstanceOf(JiraTriageReproductionError)

    expect(cleanup).toHaveBeenCalled()
  })

  it('rethrows AbortError from the suite runner without wrapping', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    const { handler } = makeHandler({
      runSuites: jest.fn().mockRejectedValue(abortError),
    })

    await expect(
      handler.process(
        {
          connectionId: 'jira-main',
          issueKey: 'JC-9',
          options: { attemptFix: false, dryRunTests: false },
        },
        {
          executionId: 'job-suite-abort',
          signal: new AbortController().signal,
        },
      ),
    ).rejects.toBe(abortError)
  })

  it('attempts autofix with the prepared workspace and comments when a draft PR lands', async () => {
    const createComment = jest
      .spyOn(JiraCommentResource.prototype, 'create')
      .mockResolvedValue(undefined)
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const workspace = { path: '/tmp/cortex-workspace/repo' }
    const { attemptFix, attemptRepro, escalate, handler } = makeHandler({
      prepare: jest.fn().mockResolvedValue(workspace),
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: '1 failing',
        },
      ]),
      attemptFix: jest.fn().mockResolvedValue({
        attempted: true,
        branchName: 'cortex/jira-jc-9-1',
        pullRequestUrl: 'https://github.com/acme/app/pull/9',
        succeeded: true,
        summary: 'Patched null guard.',
      }),
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: true, dryRunTests: false },
      },
      {
        executionId: 'job-7',
        signal: new AbortController().signal,
      },
    )

    expect(attemptRepro).not.toHaveBeenCalled()
    expect(attemptFix).toHaveBeenCalledWith(
      expect.objectContaining({
        failingSummary: '1 failing',
        workspace,
        suites: { unit: 'npm test' },
      }),
    )
    expect(createComment).toHaveBeenCalledWith(
      'JC-9',
      'start body',
      expect.any(AbortSignal),
    )
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Fix succeeded; draft PR linked on the ticket.',
        reassign: false,
      }),
    )
    expect(result.escalation?.reason).toBe('escalated')
    expect(result.fix?.succeeded).toBe(true)
  })

  it('escalates when autofix was attempted but tests stayed red', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())

    const { escalate, handler } = makeHandler({
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: '1 failing',
        },
      ]),
      attemptFix: jest.fn().mockResolvedValue({
        attempted: true,
        branchName: 'cortex/jira-jc-9-1',
        succeeded: false,
        summary: 'Still failing.',
      }),
    })

    const result = await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: true, dryRunTests: false },
      },
      {
        executionId: 'job-8',
        signal: new AbortController().signal,
      },
    )

    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Bug reproduced but fix did not leave tests green.',
        reassign: true,
      }),
    )
    expect(result.fix?.succeeded).toBe(false)
  })

  it('resolves projectLead email to a Jira mention and reassignment target', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())
    jest.spyOn(JiraUserResource.prototype, 'findByEmail').mockResolvedValue({
      accountId: 'lead-account',
      displayName: 'Lead From Jira',
      emailAddress: 'lead@example.com',
    })

    const { escalate, formatFinishComment, handler } = makeHandler({
      projectLead: {
        displayName: 'Configured Lead',
        email: 'lead@example.com',
      },
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: '1 failing',
        },
      ]),
    })

    await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-lead-mention',
        signal: new AbortController().signal,
      },
    )

    expect(formatFinishComment).toHaveBeenCalledWith(
      expect.objectContaining({
        mentionDisplayName: 'Configured Lead',
        outcome: 'reproduced_no_fix',
      }),
    )
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        escalateAccountId: 'lead-account',
        mention: {
          accountId: 'lead-account',
          displayName: 'Configured Lead',
        },
        reassign: true,
      }),
    )
  })

  it('soft-fails projectLead lookup when Jira finds no user', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())
    jest
      .spyOn(JiraUserResource.prototype, 'findByEmail')
      .mockRejectedValue(new Error('Failed to look up Jira user for email: missing@example.com'))

    const { escalate, formatFinishComment, handler } = makeHandler({
      projectLead: { email: 'missing@example.com' },
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: '1 failing',
        },
      ]),
    })

    await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-lead-missing',
        signal: new AbortController().signal,
      },
    )

    expect(formatFinishComment).toHaveBeenCalledWith(
      expect.objectContaining({
        mentionDisplayName: undefined,
        outcome: 'reproduced_no_fix',
      }),
    )
    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        escalateAccountId: 'human',
        mention: undefined,
        reassign: true,
      }),
    )
  })

  it('soft-fails projectLead lookup when Jira user search throws', async () => {
    jest.spyOn(JiraIssueResource.prototype, 'get').mockResolvedValue(makeEligibleBug())
    jest
      .spyOn(JiraUserResource.prototype, 'findByEmail')
      .mockRejectedValue(new Error('Jira search unavailable'))

    const { escalate, handler } = makeHandler({
      projectLead: { email: 'lead@example.com' },
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: '1 failing',
        },
      ]),
    })

    await handler.process(
      {
        connectionId: 'jira-main',
        issueKey: 'JC-9',
        options: { attemptFix: false, dryRunTests: false },
      },
      {
        executionId: 'job-lead-error',
        signal: new AbortController().signal,
      },
    )

    expect(escalate).toHaveBeenCalledWith(
      expect.objectContaining({
        escalateAccountId: 'human',
        mention: undefined,
        reassign: true,
      }),
    )
  })
})
