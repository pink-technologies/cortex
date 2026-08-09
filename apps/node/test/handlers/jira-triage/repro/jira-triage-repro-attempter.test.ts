// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentDefinition, SkillRegistry } from '@cortex/agent-runtime'
import { JiraIssue, JiraIssueAssignee } from '@cortex/integrations/jira'
import type { AgentProcessResolver } from '../../../../src/agent/agent-process-resolver'
import type { ExecutionEngine } from '../../../../src/execution-engine'
import { JiraTriageFixAgentId } from '../../../../src/handlers/jira-triage/fix/jira-triage-fix-attempter'
import { JiraTriageReproError } from '../../../../src/handlers/jira-triage/error/error'
import { JiraTriageReproAttempter } from '../../../../src/handlers/jira-triage/repro/jira-triage-repro-attempter'
import type { GitWorkspaceManager } from '../../../../src/workspace'

describe('JiraTriageReproAttempter', () => {
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

  const workspace = { path: '/tmp/cortex-workspace/repo' }

  function makeCoderAgent(allowSkillUse = true): AgentDefinition {
    return {
      id: JiraTriageFixAgentId,
      descriptor: {
        capabilities: [],
        delegatesTo: [],
        name: 'Coder',
        role: 'specialist',
        skills: ['write-test'],
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
    readonly resolveAgentById?: jest.Mock
    readonly runEngine?: jest.Mock
  }): {
    readonly attempter: JiraTriageReproAttempter
    readonly commitAll: jest.Mock
    readonly createBranch: jest.Mock
    readonly runEngine: jest.Mock
  } {
    const createBranch = overrides?.createBranch ?? jest.fn().mockResolvedValue(undefined)
    const commitAll = overrides?.commitAll ?? jest.fn().mockResolvedValue(true)
    const runEngine =
      overrides?.runEngine ??
      jest.fn().mockResolvedValue({
        output: JSON.stringify({ summary: 'Added null-guard regression.', succeeded: true }),
      })

    const attempter = new JiraTriageReproAttempter(
      {
        resolveAgentById:
          overrides?.resolveAgentById ?? jest.fn().mockReturnValue(makeCoderAgent()),
      } as unknown as AgentProcessResolver,
      { run: runEngine } as unknown as ExecutionEngine,
      {
        resolve: jest.fn().mockReturnValue({ prompt: 'Write a tight regression.' }),
      } as unknown as SkillRegistry,
      {
        commitAll,
        createBranch,
      } as unknown as GitWorkspaceManager,
    )

    return { attempter, commitAll, createBranch, runEngine }
  }

  it('creates a repro branch, runs the coder agent, and commits authored tests', async () => {
    const { attempter, commitAll, createBranch, runEngine } = makeAttempter()

    const result = await attempter.attempt({
      issue,
      signal: new AbortController().signal,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(createBranch).toHaveBeenCalledWith(workspace, expect.stringContaining('cortex/jira-repro-jc-9-'), expect.any(AbortSignal))
    expect(runEngine).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: JiraTriageFixAgentId,
        cwd: workspace.path,
      }),
    )
    expect(String(runEngine.mock.calls[0][0].prompt)).toContain('npm test')
    expect(commitAll).toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({
        attempted: true,
        committed: true,
        summary: 'Added null-guard regression.',
      }),
    )
  })

  it('returns committed false when the agent produces no commit', async () => {
    const { attempter } = makeAttempter({
      commitAll: jest.fn().mockResolvedValue(false),
    })

    const result = await attempter.attempt({
      issue,
      signal: new AbortController().signal,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(result.committed).toBe(false)
    expect(result.summary).toContain('no commit')
  })

  it('maps missing coder agent to JiraTriageReproError', async () => {
    const { attempter } = makeAttempter({
      resolveAgentById: jest.fn().mockImplementation(() => {
        throw new Error('missing agent')
      }),
    })

    await expect(
      attempter.attempt({
        issue,
        signal: new AbortController().signal,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toBeInstanceOf(JiraTriageReproError)
  })

  it('maps engine failures to JiraTriageReproError', async () => {
    const { attempter } = makeAttempter({
      runEngine: jest.fn().mockRejectedValue(new Error('engine down')),
    })

    await expect(
      attempter.attempt({
        issue,
        signal: new AbortController().signal,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toBeInstanceOf(JiraTriageReproError)
  })

  it('rethrows AbortError without wrapping', async () => {
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'

    const { attempter } = makeAttempter({
      runEngine: jest.fn().mockRejectedValue(abortError),
    })

    await expect(
      attempter.attempt({
        issue,
        signal: new AbortController().signal,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toBe(abortError)
  })

  it('honors throwIfAborted before starting authoring', async () => {
    const controller = new AbortController()
    controller.abort()
    const { attempter, createBranch } = makeAttempter()

    await expect(
      attempter.attempt({
        issue,
        signal: controller.signal,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toThrow()

    expect(createBranch).not.toHaveBeenCalled()
  })

  it('skips skill prompts when the coder agent disallows skill use', async () => {
    const { attempter, runEngine } = makeAttempter({
      resolveAgentById: jest.fn().mockReturnValue(makeCoderAgent(false)),
    })

    await attempter.attempt({
      issue,
      signal: new AbortController().signal,
      suites: { unit: 'npm test', ui: 'npx playwright test' },
      workspace,
    })

    expect(String(runEngine.mock.calls[0][0].prompt)).not.toContain('Write a tight regression.')
    expect(String(runEngine.mock.calls[0][0].prompt)).toContain('npx playwright test')
  })

  it('keeps a default summary when engine output is not JSON', async () => {
    const { attempter } = makeAttempter({
      runEngine: jest.fn().mockResolvedValue({ output: 'authored a test without json' }),
    })

    const result = await attempter.attempt({
      issue,
      signal: new AbortController().signal,
      suites: { unit: 'npm test' },
      workspace,
    })

    expect(result.summary).toBe('Agent repro authoring attempt completed.')
  })

  it('rethrows when the signal becomes aborted during the attempt', async () => {
    const controller = new AbortController()
    const { attempter } = makeAttempter({
      runEngine: jest.fn().mockImplementation(async () => {
        controller.abort()
        throw new Error('engine interrupted')
      }),
    })

    await expect(
      attempter.attempt({
        issue,
        signal: controller.signal,
        suites: { unit: 'npm test' },
        workspace,
      }),
    ).rejects.toThrow('engine interrupted')
  })
})
