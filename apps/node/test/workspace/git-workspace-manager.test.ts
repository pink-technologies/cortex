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
import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { GitWorkspaceManager } from '../../src/workspace/git-workspace-manager'

describe('GitWorkspaceManager', () => {
  const execFileMock = execFile as unknown as jest.Mock
  const manager = new GitWorkspaceManager()

  beforeEach(() => {
    execFileMock.mockReset()
    execFileMock.mockImplementation((
      _file: string,
      args: readonly string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      if (args[0] === 'merge-base') {
        callback(null, 'abc123mergebase\n', '')
        return
      }

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
        encoding: 'utf8',
        signal: expect.any(AbortSignal),
      }),
      expect.any(Function),
    )
    expect(workspace.mergeBaseSha).toBeUndefined()

    await manager.cleanup(workspace)
  })

  it('fetches baseRef and resolves merge-base for diff reviews', async () => {
    const workspace = await manager.prepare({
      accessToken: 'ghp_test',
      baseRef: 'develop',
      cloneUrl: 'https://github.com/pink-tech/cortex.git',
      headRef: 'feature',
      signal: new AbortController().signal,
    })

    const gitArgs = execFileMock.mock.calls.map((call) => call[1] as string[])

    expect(gitArgs).toEqual(
      expect.arrayContaining([
        [
          'fetch',
          '--depth',
          '1',
          'origin',
          '+develop:refs/remotes/origin/develop',
        ],
        ['merge-base', 'HEAD', 'refs/remotes/origin/develop'],
      ]),
    )
    expect(workspace.mergeBaseSha).toBe('abc123mergebase')

    await manager.cleanup(workspace)
  })

  it('deepens history when the first merge-base attempt fails', async () => {
    execFileMock.mockImplementation((
      _file: string,
      args: readonly string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      if (args[0] === 'merge-base') {
        const deepenCalls = execFileMock.mock.calls.filter((call) =>
          (call[1] as string[]).some((arg) => arg.startsWith('--deepen=')),
        )

        if (deepenCalls.length === 0) {
          callback(new Error('no merge base'), '', '')
          return
        }

        callback(null, 'def456mergebase\n', '')
        return
      }

      callback(null, '', '')
    })

    const workspace = await manager.prepare({
      accessToken: 'ghp_test',
      baseRef: 'main',
      cloneUrl: 'https://github.com/pink-tech/cortex.git',
      headRef: 'feature',
      signal: new AbortController().signal,
    })

    const gitArgs = execFileMock.mock.calls.map((call) => call[1] as string[])
    expect(gitArgs).toEqual(expect.arrayContaining([['fetch', '--deepen=50', 'origin']]))
    expect(workspace.mergeBaseSha).toBe('def456mergebase')

    await manager.cleanup(workspace)
  })

  it('returns undefined mergeBaseSha when baseRef fetch fails', async () => {
    execFileMock.mockImplementation((
      _file: string,
      args: readonly string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      if (args[0] === 'fetch' && args.includes('+missing:refs/remotes/origin/missing')) {
        callback(new Error('could not find ref'), '', '')
        return
      }

      callback(null, '', '')
    })

    const workspace = await manager.prepare({
      accessToken: 'ghp_test',
      baseRef: 'missing',
      cloneUrl: 'https://github.com/pink-tech/cortex.git',
      headRef: 'feature',
      signal: new AbortController().signal,
    })

    expect(workspace.mergeBaseSha).toBeUndefined()
    await manager.cleanup(workspace)
  })

  it('stops deepening when fetch --deepen fails and still attempts unshallow', async () => {
    execFileMock.mockImplementation((
      _file: string,
      args: readonly string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      if (args.some((arg) => arg.startsWith('--deepen='))) {
        callback(new Error('deepen failed'), '', '')
        return
      }

      if (args.includes('--unshallow')) {
        callback(new Error('unshallow failed'), '', '')
        return
      }

      if (args[0] === 'merge-base') {
        callback(null, '   \n', '')
        return
      }

      callback(null, '', '')
    })

    const workspace = await manager.prepare({
      accessToken: 'ghp_test',
      baseRef: 'main',
      cloneUrl: 'https://github.com/pink-tech/cortex.git',
      headRef: 'feature',
      signal: new AbortController().signal,
    })

    expect(workspace.mergeBaseSha).toBeUndefined()
    await manager.cleanup(workspace)
  })

  it('unshallows when deepen steps never yield a merge base', async () => {
    execFileMock.mockImplementation((
      _file: string,
      args: readonly string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      if (args[0] === 'merge-base') {
        const unshallowSeen = execFileMock.mock.calls.some((call) =>
          (call[1] as string[]).includes('--unshallow'),
        )

        if (unshallowSeen) {
          callback(null, 'unshallowmergebase\n', '')
          return
        }

        callback(new Error('no merge base'), '', '')
        return
      }

      callback(null, '', '')
    })

    const workspace = await manager.prepare({
      accessToken: 'ghp_test',
      baseRef: 'main',
      cloneUrl: 'https://github.com/pink-tech/cortex.git',
      headRef: 'feature',
      signal: new AbortController().signal,
    })

    const gitArgs = execFileMock.mock.calls.map((call) => call[1] as string[])
    expect(gitArgs).toEqual(expect.arrayContaining([['fetch', '--unshallow', 'origin']]))
    expect(workspace.mergeBaseSha).toBe('unshallowmergebase')

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

  it('removes the temp workspace when clone ultimately fails', async () => {
    const before = new Set(
      (await readdir(tmpdir())).filter((name) => name.startsWith('cortex-workspace-')),
    )

    execFileMock.mockImplementation((
      _file: string,
      _args: readonly string[],
      _options: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      callback(new Error('clone failed'), '', '')
    })

    await expect(
      manager.prepare({
        accessToken: 'ghp_test',
        cloneUrl: 'https://github.com/pink-tech/cortex.git',
        headRef: 'main',
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow(/clone failed/)

    const leftover = (await readdir(tmpdir())).filter(
      (name) => name.startsWith('cortex-workspace-') && !before.has(name),
    )
    expect(leftover).toEqual([])
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
