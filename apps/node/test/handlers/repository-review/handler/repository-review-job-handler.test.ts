// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { RepositoryReviewJobKind } from '@cortex/protocol'
import type { AgentDefinition, SkillRegistry } from '@cortex/agent-runtime'
import { RepositoryReviewJobHandler } from '../../../../src/handlers'
import type { AgentProcessResolver } from '../../../../src/agent/agent-process-resolver'
import type { ConfigSourceControlConnectionStore } from '../../../../src/connection'
import type { ExecutionEngine } from '../../../../src/execution-engine'
import { GitHubIssueCommentResource, GitHubPullRequest, GitHubPullResource } from '../../../../src/github'
import type { GitWorkspaceManager } from '../../../../src/workspace'
import { ExecutionJobHandlerRegistry } from '../../../../src/execution/handler'
import { ExecutionJobProcessor } from '../../../../src/execution/jobs/processing'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('repository.review handler routing', () => {
  it('resolves the repository.review handler from the registry', () => {
    const handler = {
      kind: RepositoryReviewJobKind,
      process: jest.fn(),
    }

    const registry = new ExecutionJobHandlerRegistry([handler])

    expect(registry.resolve(RepositoryReviewJobKind)).toBe(handler)
    expect(registry.supportedKinds()).toContain(RepositoryReviewJobKind)
  })

  it('dispatches repository.review jobs through the processor', async () => {
    const result = {
      findings: [],
      reviewMode: 'diff' as const,
      summary: 'Clean.',
    }

    const process = jest.fn().mockResolvedValue(result)
    const registry = new ExecutionJobHandlerRegistry([
      {
        kind: RepositoryReviewJobKind,
        process,
      },
    ])
    const processor = new ExecutionJobProcessor(registry)
    const signal = new AbortController().signal
    const payload = {
      change: {
        headRef: 'feature',
      },
      connectionId: 'github-main',
      repository: {
        cloneUrl: 'https://github.com/pink-tech/cortex.git',
        name: 'cortex',
        owner: 'pink-tech',
      },
      reviewMode: 'diff',
    }

    await expect(
      processor.process(
        {
          claimToken: '22222222-2222-4222-8222-222222222222',
          id: 'execution-job-1',
          kind: RepositoryReviewJobKind,
          payload,
        } as never,
        signal,
      ),
    ).resolves.toBe(result)

    expect(process).toHaveBeenCalledWith(payload, {
      executionId: 'execution-job-1',
      signal,
    })
  })
})

describe('RepositoryReviewJobHandler', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('composes agent prompt, AGENTS.md, skills, then publishes', async () => {
    const workspacePath = await mkdtemp(join(tmpdir(), 'cortex-review-handler-'))
    await writeFile(join(workspacePath, 'AGENTS.md'), 'Prefer early returns.\n', 'utf8')

    try {
      const connection = {
        id: 'github-main',
        provider: 'github' as const,
        token: 'ghp_test',
      }

      const agent = {
        id: 'coder',
        descriptor: {
          capabilities: ['repository.review'],
          delegatesTo: [],
          name: 'Repository Reviewer',
          role: 'specialist',
          skills: ['code-review-diff'],
          systemPrompt: 'You are the repository reviewer.',
        },
        safety: {
          allowCapabilityUse: true,
          allowDelegation: false,
          allowSkillUse: true,
          maxDelegationDepth: 0,
        },
      } as unknown as AgentDefinition

      const agentProcessResolver = {
        resolveAgent: jest.fn().mockReturnValue(agent),
      }

      const connectionStore = {
        resolve: jest.fn().mockReturnValue(connection),
      }

      const workspace = { path: workspacePath }
      const workspaceManager = {
        cleanup: jest.fn().mockResolvedValue(undefined),
        prepare: jest.fn().mockResolvedValue(workspace),
      }

      jest.spyOn(GitHubPullResource.prototype, 'get').mockResolvedValue(
        new GitHubPullRequest(undefined, undefined, 12, 'Add feature', undefined),
      )
      const createComment = jest.spyOn(GitHubIssueCommentResource.prototype, 'create').mockResolvedValue(undefined)

      const executionEngine = {
        run: jest.fn().mockResolvedValue({
          output: JSON.stringify({
            findings: [],
            reviewMode: 'diff',
            summary: 'Looks good.',
          }),
        }),
      }

      const skillRegistry = {
        resolve: jest.fn().mockReturnValue({
          description: 'Diff skill',
          id: 'code-review-diff',
          prompt: 'Focus on the change set.',
        }),
      }

      const handler = new RepositoryReviewJobHandler(
        agentProcessResolver as unknown as AgentProcessResolver,
        connectionStore as unknown as ConfigSourceControlConnectionStore,
        executionEngine as unknown as ExecutionEngine,
        skillRegistry as unknown as SkillRegistry,
        workspaceManager as unknown as GitWorkspaceManager,
      )

      const signal = new AbortController().signal
      const result = await handler.process(
        {
          change: {
            headRef: 'feature',
            pullRequestNumber: 12,
          },
          connectionId: 'github-main',
          repository: {
            cloneUrl: 'https://github.com/pink-tech/cortex.git',
            name: 'cortex',
            owner: 'pink-tech',
          },
          reviewMode: 'diff',
        },
        {
          executionId: 'execution-job-1',
          signal,
        },
      )

      expect(result).toEqual({
        findings: [],
        reviewMode: 'diff',
        summary: 'Looks good.',
      })

      const prompt = executionEngine.run.mock.calls[0][0].prompt as string
      expect(prompt).toContain('You are the repository reviewer.')
      expect(prompt).toContain('Repository agent guidelines')
      expect(prompt).toContain('Prefer early returns.')
      expect(prompt).toContain('Focus on the change set.')
      expect(prompt).toContain('Head revision: feature.')
      expect(executionEngine.run).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: 'coder',
          cwd: workspacePath,
          signal,
        }),
      )
      expect(createComment).toHaveBeenCalled()
      expect(workspaceManager.cleanup).toHaveBeenCalledWith(workspace)
    } finally {
      await rm(workspacePath, { force: true, recursive: true })
    }
  })
})
