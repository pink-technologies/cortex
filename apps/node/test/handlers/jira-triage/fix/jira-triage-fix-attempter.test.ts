// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentDefinition, SkillRegistry } from '@cortex/agent-runtime'
import { JiraIssue, JiraIssueAssignee } from '@cortex/integrations/jira'
import { GitHubPullResource } from '@cortex/integrations/github'
import type { AgentProcessResolver } from '../../../../src/agent/agent-process-resolver'
import type { SourceControlConnection } from '../../../../src/connection'
import type { ExecutionEngine } from '../../../../src/execution-engine'
import {
  JiraTriageFixAgentId,
  JiraTriageFixAttempter,
  resolveFixSummary,
} from '../../../../src/handlers/jira-triage/fix/jira-triage-fix-attempter'
import { JiraTriageFixError } from '../../../../src/handlers/jira-triage/error/error'
import type { ResolvedJiraRepository } from '../../../../src/handlers/jira-triage/models'
import type { TestRunner } from '../../../../src/handlers/jira-triage/runner/test-runner'
import type { GitWorkspaceManager } from '../../../../src/workspace'

describe('resolveFixSummary', () => {
  it('extracts trimmed summaries and rejects invalid payloads', () => {
    expect(resolveFixSummary('{"summary":"  patched  "}')).toBe('patched')
    expect(resolveFixSummary('{"summary":"   "}')).toBeUndefined()
    expect(resolveFixSummary('{"summary":42}')).toBeUndefined()
    expect(resolveFixSummary('{"ok":true}')).toBeUndefined()
    expect(resolveFixSummary('')).toBeUndefined()
    expect(resolveFixSummary('   ')).toBeUndefined()
    expect(resolveFixSummary('null')).toBeUndefined()
    expect(resolveFixSummary('not-json')).toBeUndefined()
  })
})

describe('JiraTriageFixAttempter', () => {
  const issue = new JiraIssue(
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

  const repository: ResolvedJiraRepository = {
    cloneUrl: 'https://github.com/acme/app.git',
    defaultBranch: 'main',
    name: 'app',
    owner: 'acme',
    source: 'project_map',
    unitTestCommand: 'npm test',
  }

  const sourceControlConnection = {
    id: 'github-main',
    provider: 'github',
    token: 'ghp',
  } as SourceControlConnection

  const workspace = { path: '/tmp/cortex-workspace/repo' }

  function makeCoderAgent(allowSkillUse = true): AgentDefinition {
    return {
      id: JiraTriageFixAgentId,
      descriptor: {
        capabilities: [],
        delegatesTo: [],
        name: 'Coder',
        role: 'specialist',
        skills: ['fix-bug'],
        systemPrompt: 'You are a coder.',
      },
      safety: {
        allowCapabilityUse: true,
        allowDelegation: false,
        allowSkillUse,
        maxDelegationDepth: 0,
      },
    } as unknown as AgentDefinition
  }

  function makeAttempter(overrides?: {
    readonly commitAll?: jest.Mock
    readonly createBranch?: jest.Mock
    readonly pushBranch?: jest.Mock
    readonly resolveAgentById?: jest.Mock
    readonly runEngine?: jest.Mock
    readonly runSuites?: jest.Mock
  }): {
    readonly attempter: JiraTriageFixAttempter
    readonly commitAll: jest.Mock
    readonly createBranch: jest.Mock
    readonly pushBranch: jest.Mock
    readonly runEngine: jest.Mock
    readonly runSuites: jest.Mock
  } {
    const createBranch = overrides?.createBranch ?? jest.fn().mockResolvedValue(undefined)
    const commitAll = overrides?.commitAll ?? jest.fn().mockResolvedValue(true)
    const pushBranch = overrides?.pushBranch ?? jest.fn().mockResolvedValue(undefined)
    const runEngine =
      overrides?.runEngine ??
      jest.fn().mockResolvedValue({
        output: JSON.stringify({ summary: 'Patched null guard.', succeeded: true }),
      })
    const runSuites =
      overrides?.runSuites ??
      jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 0,
          suiteId: 'unit',
          summary: 'pass',
        },
      ])

    const attempter = new JiraTriageFixAttempter(
      {
        resolveAgentById:
          overrides?.resolveAgentById ?? jest.fn().mockReturnValue(makeCoderAgent()),
      } as unknown as AgentProcessResolver,
      { run: runEngine } as unknown as ExecutionEngine,
      {
        resolve: jest.fn().mockReturnValue({ prompt: 'Fix carefully.' }),
      } as unknown as SkillRegistry,
      { run: runSuites } as unknown as TestRunner,
      {
        commitAll,
        createBranch,
        pushBranch,
      } as unknown as GitWorkspaceManager,
    )

    return { attempter, commitAll, createBranch, pushBranch, runEngine, runSuites }
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('creates a branch on the prepared workspace, retests, pushes, and opens a draft PR', async () => {
    const createDraft = jest
      .spyOn(GitHubPullResource.prototype, 'createDraft')
      .mockResolvedValue('https://github.com/acme/app/pull/1')

    const { attempter, commitAll, createBranch, pushBranch, runEngine, runSuites } = makeAttempter()

    const result = await attempter.attempt({
      failingSummary: '1 failing',
      issue,
      repository,
      signal: new AbortController().signal,
      sourceControlConnection,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(createBranch).toHaveBeenCalledWith(workspace, expect.stringContaining('cortex/jira-jc-9-'), expect.any(AbortSignal))
    expect(runEngine).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: JiraTriageFixAgentId,
        cwd: workspace.path,
      }),
    )
    expect(commitAll).toHaveBeenCalledWith(
      workspace,
      'fix(JC-9): Patched null guard.',
      expect.any(AbortSignal),
    )
    expect(runSuites).toHaveBeenCalledWith(
      expect.objectContaining({
        workingDirectory: workspace.path,
      }),
    )
    expect(pushBranch).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace,
        branchName: expect.stringContaining('cortex/jira-jc-9-'),
      }),
    )
    expect(createDraft).toHaveBeenCalled()
    expect(result).toEqual({
      attempted: true,
      branchName: expect.stringContaining('cortex/jira-jc-9-'),
      pullRequestUrl: 'https://github.com/acme/app/pull/1',
      succeeded: true,
      summary: 'Patched null guard.',
    })
  })

  it('returns succeeded false when the agent produces no commit', async () => {
    const { attempter, pushBranch } = makeAttempter({
      commitAll: jest.fn().mockResolvedValue(false),
    })

    const result = await attempter.attempt({
      failingSummary: '1 failing',
      issue,
      repository,
      signal: new AbortController().signal,
      sourceControlConnection,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(result).toEqual({
      attempted: true,
      branchName: expect.stringContaining('cortex/jira-jc-9-'),
      succeeded: false,
      summary: 'Agent produced no commit.',
    })
    expect(pushBranch).not.toHaveBeenCalled()
  })

  it('returns succeeded false when retest still fails', async () => {
    const { attempter, pushBranch } = makeAttempter({
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          exitCode: 1,
          suiteId: 'unit',
          summary: 'still failing',
        },
      ]),
    })

    const result = await attempter.attempt({
      failingSummary: '1 failing',
      issue,
      repository,
      signal: new AbortController().signal,
      sourceControlConnection,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(result.succeeded).toBe(false)
    expect(result.summary).toBe('Patched null guard.')
    expect(pushBranch).not.toHaveBeenCalled()
  })

  it('treats missing retest exit codes as success', async () => {
    jest.spyOn(GitHubPullResource.prototype, 'createDraft').mockResolvedValue(
      'https://github.com/acme/app/pull/4',
    )

    const { attempter, pushBranch } = makeAttempter({
      runSuites: jest.fn().mockResolvedValue([
        {
          command: 'npm test',
          suiteId: 'unit',
          summary: 'pass',
        },
      ]),
    })

    const result = await attempter.attempt({
      failingSummary: '1 failing',
      issue,
      repository,
      signal: new AbortController().signal,
      sourceControlConnection,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(result.succeeded).toBe(true)
    expect(pushBranch).toHaveBeenCalled()
  })

  it('maps missing coder agent to JiraTriageFixError', async () => {
    const { attempter } = makeAttempter({
      resolveAgentById: jest.fn().mockImplementation(() => {
        throw new Error('unknown agent')
      }),
    })

    await expect(
      attempter.attempt({
        failingSummary: '1 failing',
        issue,
        repository,
        signal: new AbortController().signal,
        sourceControlConnection,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toBeInstanceOf(JiraTriageFixError)
  })

  it('maps engine failures to JiraTriageFixError', async () => {
    const { attempter } = makeAttempter({
      runEngine: jest.fn().mockRejectedValue(new Error('engine down')),
    })

    await expect(
      attempter.attempt({
        failingSummary: '1 failing',
        issue,
        repository,
        signal: new AbortController().signal,
        sourceControlConnection,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toMatchObject({
      code: 'JIRA_TRIAGE_FIX_FAILED',
      issueKey: 'JC-9',
    })
  })

  it('rethrows AbortError without wrapping', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'

    const { attempter } = makeAttempter({
      createBranch: jest.fn().mockRejectedValue(abortError),
    })

    await expect(
      attempter.attempt({
        failingSummary: '1 failing',
        issue,
        repository,
        signal: new AbortController().signal,
        sourceControlConnection,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toBe(abortError)
  })

  it('rethrows when the signal becomes aborted during the attempt', async () => {
    const controller = new AbortController()
    const interrupted = new Error('interrupted')

    const { attempter } = makeAttempter({
      createBranch: jest.fn().mockImplementation(async () => {
        controller.abort()
        throw interrupted
      }),
    })

    await expect(
      attempter.attempt({
        failingSummary: '1 failing',
        issue,
        repository,
        signal: controller.signal,
        sourceControlConnection,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toBe(interrupted)
  })

  it('honors throwIfAborted before starting autofix', async () => {
    const controller = new AbortController()
    controller.abort()
    const createBranch = jest.fn()

    const { attempter } = makeAttempter({ createBranch })

    await expect(
      attempter.attempt({
        failingSummary: '1 failing',
        issue,
        repository,
        signal: controller.signal,
        sourceControlConnection,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toBeDefined()
    expect(createBranch).not.toHaveBeenCalled()
  })

  it('keeps a default summary when engine output is not JSON', async () => {
    jest.spyOn(GitHubPullResource.prototype, 'createDraft').mockResolvedValue(
      'https://github.com/acme/app/pull/2',
    )

    const { attempter, commitAll } = makeAttempter({
      runEngine: jest.fn().mockResolvedValue({ output: 'fixed it without json' }),
    })

    const result = await attempter.attempt({
      failingSummary: '1 failing',
      issue,
      repository,
      signal: new AbortController().signal,
      sourceControlConnection,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(commitAll).toHaveBeenCalledWith(
      workspace,
      'fix(JC-9): Agent fix attempt completed.',
      expect.any(AbortSignal),
    )
    expect(result.summary).toBe('Agent fix attempt completed.')
    expect(result.succeeded).toBe(true)
  })

  it('ignores non-string and blank summary values from engine JSON', async () => {
    jest.spyOn(GitHubPullResource.prototype, 'createDraft').mockResolvedValue(
      'https://github.com/acme/app/pull/5',
    )

    const { attempter, commitAll } = makeAttempter({
      runEngine: jest.fn().mockResolvedValue({
        output: JSON.stringify({ summary: 42, succeeded: true }),
      }),
    })

    const blank = await makeAttempter({
      runEngine: jest.fn().mockResolvedValue({
        output: JSON.stringify({ summary: '   ', succeeded: true }),
      }),
    }).attempter.attempt({
      failingSummary: '1 failing',
      issue,
      repository,
      signal: new AbortController().signal,
      sourceControlConnection,
      suites: { unit: 'npm test' },
      workspace,
    })

    const result = await attempter.attempt({
      failingSummary: '1 failing',
      issue,
      repository,
      signal: new AbortController().signal,
      sourceControlConnection,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(commitAll).toHaveBeenCalledWith(
      workspace,
      'fix(JC-9): Agent fix attempt completed.',
      expect.any(AbortSignal),
    )
    expect(result.summary).toBe('Agent fix attempt completed.')
    expect(blank.summary).toBe('Agent fix attempt completed.')
  })

  it('skips skill prompts when the coder agent disallows skill use', async () => {
    jest.spyOn(GitHubPullResource.prototype, 'createDraft').mockResolvedValue(
      'https://github.com/acme/app/pull/3',
    )
    const resolveSkill = jest.fn()

    const attempter = new JiraTriageFixAttempter(
      {
        resolveAgentById: jest.fn().mockReturnValue(makeCoderAgent(false)),
      } as unknown as AgentProcessResolver,
      {
        run: jest.fn().mockResolvedValue({
          output: JSON.stringify({ summary: 'Done.', succeeded: true }),
        }),
      } as unknown as ExecutionEngine,
      { resolve: resolveSkill } as unknown as SkillRegistry,
      {
        run: jest.fn().mockResolvedValue([
          { command: 'npm test', exitCode: 0, suiteId: 'unit', summary: 'pass' },
        ]),
      } as unknown as TestRunner,
      {
        commitAll: jest.fn().mockResolvedValue(true),
        createBranch: jest.fn().mockResolvedValue(undefined),
        pushBranch: jest.fn().mockResolvedValue(undefined),
      } as unknown as GitWorkspaceManager,
    )

    await attempter.attempt({
      failingSummary: '1 failing',
      issue,
      repository,
      signal: new AbortController().signal,
      sourceControlConnection,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(resolveSkill).not.toHaveBeenCalled()
  })
})
