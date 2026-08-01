// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

jest.mock('node:child_process', () => ({
  execFile: jest.fn((
    _file: string,
    _args: readonly string[],
    _options: unknown,
    callback: (error: Error | null, stdout: string, stderr: string) => void,
  ) => {
    callback(null, '', '')
  }),
}))

import { execFile } from 'node:child_process'
import { GitWorkspaceManager } from '../../src/workspace/git-workspace-manager'

describe('GitWorkspaceManager', () => {
  const execFileMock = execFile as unknown as jest.Mock
  const manager = new GitWorkspaceManager()

  beforeEach(() => {
    execFileMock.mockReset()
    execFileMock.mockImplementation((
      _file: string,
      _args: readonly string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      callback(null, '', '')
    })
  })

  it('clones with an authenticated HTTPS URL and branch tip', async () => {
    const workspace = await manager.prepare({
      accessToken: 'ghp_test',
      cloneUrl: 'https://github.com/pink-tech/cortex.git',
      headRef: 'main',
      signal: new AbortController().signal,
    })

    expect(execFileMock).toHaveBeenCalledWith(
      'git',
      [
        'clone',
        '--depth',
        '1',
        '--branch',
        'main',
        'https://x-access-token:ghp_test@github.com/pink-tech/cortex.git',
        expect.stringContaining('/repo'),
      ],
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
      expect.any(Function),
    )

    await manager.cleanup(workspace)
  })

  it('falls back to full clone and checkout when shallow branch clone fails', async () => {
    execFileMock
      .mockImplementationOnce((
        _file: string,
        _args: readonly string[],
        _options: unknown,
        callback: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        callback(new Error('Remote branch not found'), '', '')
      })
      .mockImplementation((
        _file: string,
        _args: readonly string[],
        _options: unknown,
        callback: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        callback(null, '', '')
      })

    const workspace = await manager.prepare({
      accessToken: 'ghp_test',
      cloneUrl: 'https://github.com/pink-tech/cortex.git',
      headRef: 'abc1234',
      signal: new AbortController().signal,
    })

    expect(execFileMock).toHaveBeenCalledTimes(3)
    expect(execFileMock.mock.calls[1]?.[1]).toEqual([
      'clone',
      'https://x-access-token:ghp_test@github.com/pink-tech/cortex.git',
      expect.stringContaining('/repo'),
    ])
    expect(execFileMock.mock.calls[2]?.[1]).toEqual(['checkout', 'abc1234'])
    expect(execFileMock.mock.calls[2]?.[2]).toEqual(
      expect.objectContaining({
        cwd: workspace.path,
      }),
    )

    await manager.cleanup(workspace)
  })

  it('rejects non-HTTPS clone URLs', async () => {
    await expect(
      manager.prepare({
        accessToken: 'ghp_test',
        cloneUrl: 'ssh://git@github.com/pink-tech/cortex.git',
        headRef: 'main',
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow(/Only HTTPS clone URLs/)
  })

  it('creates a branch, commits, and pushes', async () => {
    const workspace = { path: '/tmp/cortex-workspace-test/repo' }

    await manager.createBranch(workspace, 'cortex/fix', new AbortController().signal)
    expect(execFileMock.mock.calls.at(-1)?.[1]).toEqual(['checkout', '-b', 'cortex/fix'])

    await expect(
      manager.commitAll(workspace, 'fix: test', new AbortController().signal),
    ).resolves.toBe(true)

    await manager.pushBranch({
      accessToken: 'ghp_test',
      branchName: 'cortex/fix',
      cloneUrl: 'https://github.com/pink-tech/cortex.git',
      signal: new AbortController().signal,
      workspace,
    })

    expect(execFileMock.mock.calls.at(-1)?.[1]).toEqual([
      'push',
      'https://x-access-token:ghp_test@github.com/pink-tech/cortex.git',
      'HEAD:refs/heads/cortex/fix',
    ])
  })

  it('returns false when commit finds nothing to commit', async () => {
    execFileMock
      .mockImplementationOnce((
        _file: string,
        _args: readonly string[],
        _options: unknown,
        callback: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        callback(null, '', '')
      })
      .mockImplementationOnce((
        _file: string,
        _args: readonly string[],
        _options: unknown,
        callback: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        callback(new Error('nothing to commit'), '', '')
      })

    await expect(
      manager.commitAll(
        { path: '/tmp/cortex-workspace-test/repo' },
        'fix: empty',
        new AbortController().signal,
      ),
    ).resolves.toBe(false)
  })
})

