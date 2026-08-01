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
   * @param request - Clone parameters and cancellation signal.
   * @returns The prepared workspace.
   */
  async prepare(request: PrepareWorkspaceRequest): Promise<PreparedWorkspace> {
    request.signal.throwIfAborted()

    const root = await mkdtemp(join(tmpdir(), 'cortex-workspace-'))
    const repositoryPath = join(root, 'repo')
    const authenticatedCloneUrl = this.injectAccessToken(request.cloneUrl, request.accessToken)

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

    return {
      path: repositoryPath,
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
    signal.throwIfAborted()

    await execFileAsync('git', [...args], {
      cwd,
      signal,
    })
  }
}
