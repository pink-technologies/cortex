// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { PreparedWorkspace, PrepareWorkspaceRequest } from './models'
import type { WorkspaceManager } from './workspace-manager'

const execFileAsync = promisify(execFile)

/**
 * Depth increments used when a shallow clone cannot yet resolve merge-base.
 */
const MERGE_BASE_DEEPEN_STEPS = [50, 100, 200, 500] as const

/**
 * File-system {@link WorkspaceManager} that clones repositories with git.
 */
@Injectable()
export class GitWorkspaceManager implements WorkspaceManager {
  // MARK: - WorkspaceManager

  /**
   * Removes the temporary workspace directory.
   *
   * @param workspace - Workspace returned by {@link prepare}.
   */
  async cleanup(workspace: PreparedWorkspace): Promise<void> {
    await rm(workspace.path, { force: true, recursive: true })
  }

  /**
   * Creates a temporary directory, clones the repository, and checks out
   * {@link PrepareWorkspaceRequest.headRef}.
   *
   * When {@link PrepareWorkspaceRequest.baseRef} is set, fetches that ref and
   * deepens (or unshallows) history until a merge base with `HEAD` is found.
   *
   * @param request - Clone parameters and cancellation signal.
   * @returns The prepared workspace, optionally including `mergeBaseSha`.
   */
  async prepare(request: PrepareWorkspaceRequest): Promise<PreparedWorkspace> {
    request.signal.throwIfAborted()

    // Validate clone URL before allocating a temp directory.
    const authenticatedCloneUrl = this.injectAccessToken(request.cloneUrl, request.accessToken)
    const root = await mkdtemp(join(tmpdir(), 'cortex-workspace-'))
    const repositoryPath = join(root, 'repo')

    try {
      try {
        await this.runGit(
          ['clone', '--depth', '1', '--branch', request.headRef, authenticatedCloneUrl, repositoryPath],
          request.signal,
        )
      } catch {
        // Fall back to a full clone + checkout when the ref is not a remote branch tip.
        await this.runGit(['clone', authenticatedCloneUrl, repositoryPath], request.signal)
        await this.runGit(['checkout', request.headRef], request.signal, repositoryPath)
      }

      request.signal.throwIfAborted()

      const mergeBaseSha = request.baseRef
        ? await this.resolveMergeBase(repositoryPath, request.baseRef, request.signal)
        : undefined

      return {
        path: repositoryPath,
        ...(mergeBaseSha ? { mergeBaseSha } : {}),
      }
    } catch (error) {
      await rm(root, { force: true, recursive: true })
      throw error
    }
  }

  /**
   * Creates and checks out a new local branch.
   */
  async createBranch(
    workspace: PreparedWorkspace,
    branchName: string,
    signal: AbortSignal,
  ): Promise<void> {
    await this.runGit(['checkout', '-b', branchName], signal, workspace.path)
  }

  /**
   * Stages all changes and creates a commit when the worktree is dirty.
   *
   * @returns `true` when a commit was created.
   */
  async commitAll(
    workspace: PreparedWorkspace,
    message: string,
    signal: AbortSignal,
  ): Promise<boolean> {
    await this.runGit(['add', '-A'], signal, workspace.path)

    try {
      await this.runGit(
        [
          '-c',
          'user.name=Cortex',
          '-c',
          'user.email=cortex@pink-tech.io',
          'commit',
          '-m',
          message,
        ],
        signal,
        workspace.path,
      )
      return true
    } catch {
      return false
    }
  }

  /**
   * Pushes the current branch to origin using the provided access token.
   */
  async pushBranch(input: {
    readonly accessToken: string
    readonly branchName: string
    readonly cloneUrl: string
    readonly signal: AbortSignal
    readonly workspace: PreparedWorkspace
  }): Promise<void> {
    const remoteUrl = this.injectAccessToken(input.cloneUrl, input.accessToken)
    await this.runGit(
      ['push', remoteUrl, `HEAD:refs/heads/${input.branchName}`],
      input.signal,
      input.workspace.path,
    )
  }

  // MARK: - Private methods

  /**
   * Fetches {@link baseRef} and deepens history until merge-base resolves.
   *
   * @returns The merge-base SHA, or `undefined` when it cannot be resolved.
   */
  private async resolveMergeBase(
    repositoryPath: string,
    baseRef: string,
    signal: AbortSignal,
  ): Promise<string | undefined> {
    const remoteBaseRef = `refs/remotes/origin/${baseRef}`

    try {
      await this.runGit(
        ['fetch', '--depth', '1', 'origin', `+${baseRef}:${remoteBaseRef}`],
        signal,
        repositoryPath,
      )
    } catch {
      return undefined
    }

    const mergeBase = await this.tryMergeBase(repositoryPath, remoteBaseRef, signal)

    if (mergeBase) {
      return mergeBase
    }

    for (const deepen of MERGE_BASE_DEEPEN_STEPS) {
      signal.throwIfAborted()

      try {
        await this.runGit(['fetch', `--deepen=${deepen}`, 'origin'], signal, repositoryPath)
      } catch {
        break
      }

      const deepened = await this.tryMergeBase(repositoryPath, remoteBaseRef, signal)

      if (deepened) {
        return deepened
      }
    }

    try {
      await this.runGit(['fetch', '--unshallow', 'origin'], signal, repositoryPath)
    } catch {
      // Already complete or remote does not support unshallow.
    }

    return this.tryMergeBase(repositoryPath, remoteBaseRef, signal)
  }

  private async tryMergeBase(
    repositoryPath: string,
    remoteBaseRef: string,
    signal: AbortSignal,
  ): Promise<string | undefined> {
    try {
      const sha = (
        await this.runGitCapture(['merge-base', 'HEAD', remoteBaseRef], signal, repositoryPath)
      ).trim()

      return sha.length > 0 ? sha : undefined
    } catch {
      return undefined
    }
  }

  /**
   * Injects a token into an HTTPS clone URL without logging credentials.
   */
  private injectAccessToken(cloneUrl: string, accessToken: string): string {
    const url = new URL(cloneUrl)

    if (url.protocol !== 'https:') {
      throw new Error('Only HTTPS clone URLs are supported for authenticated workspace preparation.')
    }

    url.username = 'x-access-token'
    url.password = accessToken

    return url.toString()
  }

  private async runGit(args: readonly string[], signal: AbortSignal, cwd?: string): Promise<void> {
    await this.runGitCapture(args, signal, cwd)
  }

  private async runGitCapture(
    args: readonly string[],
    signal: AbortSignal,
    cwd?: string,
  ): Promise<string> {
    signal.throwIfAborted()

    const result = await execFileAsync('git', [...args], {
      cwd,
      encoding: 'utf8',
      signal,
    })

    if (typeof result === 'string') {
      return result
    }

    return result.stdout ?? ''
  }
}
