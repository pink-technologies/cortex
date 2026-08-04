// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { RepositoryReviewJobKind } from '@cortex/protocol'
import type { AgentDefinition, SkillRegistry } from '@cortex/agent-runtime'
import { RepositoryReviewJobHandler } from '../../../../src/handlers'
import type { AgentProcessResolver } from '../../../../src/agent/agent-process-resolver'
import type { ConfigSourceControlConnectionStore } from '../../../../src/connection'
import type { ExecutionEngine } from '../../../../src/execution-engine'
import { GitHubIssueCommentResource, GitHubPullRequest, GitHubPullResource } from '@cortex/integrations/github'
import type { GitWorkspaceManager } from '../../../../src/workspace'
import { ExecutionJobHandlerRegistry } from '../../../../src/execution/handler'
import { ExecutionJobProcessor } from '../../../../src/execution/jobs/processing'
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises'
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

  it('composes agent prompt, guidelines, required diff skill, then publishes', async () => {
    const workspacePath = await mkdtemp(join(tmpdir(), 'cortex-review-handler-'))
    await writeFile(join(workspacePath, 'AGENTS.md'), 'Prefer early returns.\n', 'utf8')
    await mkdir(join(workspacePath, '.cursor', 'rules'), { recursive: true })
    await writeFile(join(workspacePath, '.cursor', 'rules', 'api.mdc'), 'Validate DTOs.\n', 'utf8')

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
          skills: ['minimal-fix'],
          systemPrompt: 'You are the repository reviewer.',
        },
        safety: {
          allowCapabilityUse: true,
          allowDelegation: false,
          allowSkillUse: false,
          maxDelegationDepth: 0,
        },
      } as unknown as AgentDefinition

      const agentProcessResolver = {
        resolveAgent: jest.fn().mockReturnValue(agent),
      }

      const connectionStore = {
        resolve: jest.fn().mockReturnValue(connection),
      }

      const workspace = { mergeBaseSha: 'abc123merge', path: workspacePath }
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
            appliedPolicies: [],
            appliedSkills: ['code-review-diff'],
            decision: 'approve',
            findings: [],
            limitations: [],
            strengths: [],
            summary: 'Looks good.',
            validation: {
              notPerformed: ['Build and tests were not executed.'],
              performed: ['Inspected the merge-base change set.'],
            },
          }),
        }),
      }

      const skillRegistry = {
        resolve: jest.fn((skillId: string) => {
          if (skillId === 'code-review-diff') {
            return {
              description: 'Diff skill',
              id: 'code-review-diff',
              prompt: 'Focus on the change set.',
            }
          }

          if (skillId === 'minimal-fix') {
            return {
              description: 'Minimal fix skill',
              id: 'minimal-fix',
              prompt: 'Keep the fix small.',
            }
          }

          throw new Error(`unexpected skill ${skillId}`)
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
            baseRef: 'main',
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
        appliedPolicies: [],
        appliedSkills: ['code-review-diff'],
        decision: 'approve',
        findings: [],
        limitations: [],
        strengths: [],
        summary: 'Looks good.',
        validation: {
          notPerformed: ['Build and tests were not executed.'],
          performed: ['Inspected the merge-base change set.'],
        },
      })
      expect(workspaceManager.prepare).toHaveBeenCalledWith(
        expect.objectContaining({
          baseRef: 'main',
          headRef: 'feature',
        }),
      )

      const prompt = executionEngine.run.mock.calls[0][0].prompt as string
      expect(prompt).toContain('You are the repository reviewer.')
      expect(prompt).toContain('Repository agent guidelines')
      expect(prompt).toContain('Prefer early returns.')
      expect(prompt).toContain('Cursor rules')
      expect(prompt).toContain('Validate DTOs.')
      expect(prompt).toContain('Focus on the change set.')
      expect(prompt).toContain('Head revision: feature.')
      expect(prompt).toContain('Merge base SHA: abc123merge.')
      expect(skillRegistry.resolve).toHaveBeenCalledWith('code-review-diff')
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

