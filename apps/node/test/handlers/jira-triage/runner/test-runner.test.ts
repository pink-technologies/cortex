// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

jest.mock('node:child_process', () => ({
  spawn: jest.fn(),
}))

import { spawn } from 'node:child_process'
import type { CommandConfiguration } from '../../../../src/connection'
import {
  IosSimulatorDestinationNotFoundError,
  type IosSimulatorDestinationResolver,
} from '../../../../src/handlers/jira-triage/runner/ios-simulator-destination-resolver'
import {
  buildSuiteProcessEnv,
  TestRunner,
} from '../../../../src/handlers/jira-triage/runner/test-runner'

type SpawnResult = {
  readonly code?: number | null
  readonly error?: Error & { code?: number | string }
  readonly stderr?: string
  readonly stdout?: string
}

function suite(
  executable: string,
  argumentsList: readonly string[] = [],
): CommandConfiguration {
  return {
    arguments: argumentsList,
    executable,
    workingDirectory: '.',
  }
}

function mockSpawnProcess(result: SpawnResult = { code: 0, stdout: 'ok\n' }) {
  return {
    kill: jest.fn(),
    on: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
      if (event === 'error' && result.error) {
        queueMicrotask(() => callback(result.error))
        return
      }

      if (event === 'close' && !result.error) {
        queueMicrotask(() => callback(result.code ?? 0, null))
      }
    }),
    stderr: {
      on: jest.fn((event: string, callback: (chunk: string) => void) => {
        if (event === 'data' && result.stderr) {
          callback(result.stderr)
        }
      }),
    },
    stdout: {
      on: jest.fn((event: string, callback: (chunk: string) => void) => {
        if (event === 'data' && result.stdout) {
          callback(result.stdout)
        }
      }),
    },
  }
}

describe('TestRunner', () => {
  const spawnMock = spawn as unknown as jest.Mock
  const resolveMock = jest.fn()
  const iosSimulatorDestinationResolver = {
    resolve: resolveMock,
  } as unknown as IosSimulatorDestinationResolver
  const runner = new TestRunner(iosSimulatorDestinationResolver)

  beforeEach(() => {
    spawnMock.mockReset()
    resolveMock.mockReset()
    resolveMock.mockResolvedValue({
      destination: 'platform=iOS Simulator,id=resolved-udid',
      id: 'resolved-udid',
      name: 'iPhone 17e',
    })
    spawnMock.mockImplementation(() => mockSpawnProcess())
  })

  it('reports dry-run suites without executing', () => {
    expect(
      runner.dryRun({
        unit: suite('npm', ['test']),
        ui: suite('npx', ['playwright', 'test']),
      }),
    ).toEqual([
      { command: 'npm test', suiteId: 'unit', summary: 'dry-run' },
      { command: 'npx playwright test', suiteId: 'ui', summary: 'dry-run' },
    ])
    expect(runner.dryRun({})).toEqual([])
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('runs allowlisted suites and captures failures', async () => {
    spawnMock
      .mockImplementationOnce(() => mockSpawnProcess({ code: 0, stdout: 'pass\n' }))
      .mockImplementationOnce(() =>
        mockSpawnProcess({ code: 1, stderr: 'boom', stdout: '' }),
      )

    const results = await runner.run({
      signal: new AbortController().signal,
      suites: {
        unit: suite('npm', ['test']),
        ui: suite('npx', ['playwright', 'test']),
      },
      workingDirectory: '/tmp/repo',
    })

    expect(results).toEqual([
      {
        command: 'npm test',
        exitCode: 0,
        suiteId: 'unit',
        summary: 'pass',
      },
      {
        command: 'npx playwright test',
        exitCode: 1,
        suiteId: 'ui',
        summary: 'boom',
      },
    ])
    expect(spawnMock.mock.calls[0]?.[0]).toBe('npm')
    expect(spawnMock.mock.calls[0]?.[1]).toEqual(['test'])
    expect(spawnMock.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        cwd: '/tmp/repo',
        shell: false,
      }),
    )
  })

  it('truncates large output with head and tail', async () => {
    const head = 'HEAD_MARKER'
    const tail = 'Testing cancelled because the build failed.\n** BUILD FAILED **'
    const middle = 'm'.repeat(3_000)

    spawnMock.mockImplementation(() =>
      mockSpawnProcess({ code: 0, stdout: `${head}${middle}${tail}\n` }),
    )

    const results = await runner.run({
      signal: new AbortController().signal,
      suites: { unit: suite('npm', ['test']) },
      workingDirectory: '/tmp/repo',
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.summary?.length).toBeLessThanOrEqual(2_000)
    expect(results[0]?.summary).toContain('HEAD_MARKER')
    expect(results[0]?.summary).toContain('\n…\n')
    expect(results[0]?.summary).toContain('BUILD FAILED')
  })

  it('rethrows cancellation instead of recording a failed suite', async () => {
    const controller = new AbortController()

    spawnMock.mockImplementation(() => {
      const error = new Error('The operation was aborted') as Error & {
        code?: number | string
      }
      error.name = 'AbortError'
      controller.abort()
      return mockSpawnProcess({ error })
    })

    await expect(
      runner.run({
        signal: controller.signal,
        suites: { unit: suite('npm', ['test']) },
        workingDirectory: '/tmp/repo',
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('rethrows when the signal is aborted even if the error name is not AbortError', async () => {
    const controller = new AbortController()

    spawnMock.mockImplementation(() => {
      controller.abort()
      return mockSpawnProcess({
        error: new Error('killed by signal'),
      })
    })

    await expect(
      runner.run({
        signal: controller.signal,
        suites: { unit: suite('npm', ['test']) },
        workingDirectory: '/tmp/repo',
      }),
    ).rejects.toThrow('killed by signal')
  })

  it('records a failed suite when the error is not an AbortError and the signal is live', async () => {
    const error = new Error('command missing') as Error & { code?: string }
    error.code = 'ENOENT'
    spawnMock.mockImplementation(() => mockSpawnProcess({ error }))

    const results = await runner.run({
      signal: new AbortController().signal,
      suites: { unit: suite('missing-tool') },
      workingDirectory: '/tmp/repo',
    })

    expect(results).toEqual([
      {
        command: 'missing-tool',
        exitCode: 1,
        suiteId: 'unit',
        summary: 'exit 1',
      },
    ])
  })

  it('summarizes failed suite stdout when stderr is absent', async () => {
    spawnMock.mockImplementation(() =>
      mockSpawnProcess({ code: 2, stdout: 'assertion failed', stderr: '' }),
    )

    const results = await runner.run({
      signal: new AbortController().signal,
      suites: { unit: suite('npm', ['test']) },
      workingDirectory: '/tmp/repo',
    })

    expect(results).toEqual([
      {
        command: 'npm test',
        exitCode: 2,
        suiteId: 'unit',
        summary: 'assertion failed',
      },
    ])
  })

  it('honors throwIfAborted before starting a suite', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      runner.run({
        signal: controller.signal,
        suites: { unit: suite('npm', ['test']) },
        workingDirectory: '/tmp/repo',
      }),
    ).rejects.toBeDefined()
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('summarizes empty successful output as exit 0', async () => {
    spawnMock.mockImplementation(() => mockSpawnProcess({ code: 0, stdout: '', stderr: '' }))

    const results = await runner.run({
      signal: new AbortController().signal,
      suites: { unit: suite('npm', ['test']) },
      workingDirectory: '/tmp/repo',
    })

    expect(results[0]?.summary).toBe('exit 0')
  })

  it('passes TEST_RUNNER_ mirrors for Truvideo tokens into suite exec env', async () => {
    const previousAccess = process.env.TRUVIDEO_ACCESS_TOKEN
    const previousRefresh = process.env.TRUVIDEO_REFRESH_TOKEN

    process.env.TRUVIDEO_ACCESS_TOKEN = 'access-token'
    process.env.TRUVIDEO_REFRESH_TOKEN = 'refresh-token'

    try {
      await runner.run({
        signal: new AbortController().signal,
        suites: {
          TruvideoSdk: suite('xcodebuild', ['build', '-scheme', 'TruvideoSdk']),
        },
        workingDirectory: '/tmp/repo',
      })

      expect(resolveMock).not.toHaveBeenCalled()
      expect(spawnMock).toHaveBeenCalledWith(
        'xcodebuild',
        ['build', '-scheme', 'TruvideoSdk'],
        expect.objectContaining({
          env: expect.objectContaining({
            TEST_RUNNER_TRUVIDEO_ACCESS_TOKEN: 'access-token',
            TEST_RUNNER_TRUVIDEO_REFRESH_TOKEN: 'refresh-token',
            TRUVIDEO_ACCESS_TOKEN: 'access-token',
            TRUVIDEO_REFRESH_TOKEN: 'refresh-token',
          }),
          shell: false,
        }),
      )
    } finally {
      if (previousAccess === undefined) {
        delete process.env.TRUVIDEO_ACCESS_TOKEN
      } else {
        process.env.TRUVIDEO_ACCESS_TOKEN = previousAccess
      }

      if (previousRefresh === undefined) {
        delete process.env.TRUVIDEO_REFRESH_TOKEN
      } else {
        process.env.TRUVIDEO_REFRESH_TOKEN = previousRefresh
      }
    }
  })

  it('resolves an iOS Simulator once and appends destinations before exec', async () => {
    const results = await runner.run({
      signal: new AbortController().signal,
      suites: {
        TruvideoSdk: suite('xcodebuild', ['test', '-scheme', 'TruvideoSdk']),
        other: suite('npm', ['test']),
      },
      workingDirectory: '/tmp/repo',
    })

    expect(resolveMock).toHaveBeenCalledTimes(1)
    expect(results[0]?.command).toBe(
      'xcodebuild test -scheme TruvideoSdk -destination platform=iOS Simulator,id=resolved-udid',
    )
    expect(results[1]?.command).toBe('npm test')
    expect(spawnMock).toHaveBeenCalledTimes(2)
    expect(spawnMock.mock.calls[0]?.[0]).toBe('xcodebuild')
    expect(spawnMock.mock.calls[0]?.[1]).toEqual([
      'test',
      '-scheme',
      'TruvideoSdk',
      '-destination',
      'platform=iOS Simulator,id=resolved-udid',
    ])
  })

  it('skips iOS suite execution when no simulator can be resolved', async () => {
    resolveMock.mockRejectedValue(new IosSimulatorDestinationNotFoundError())

    const results = await runner.run({
      signal: new AbortController().signal,
      suites: {
        TruvideoSdk: suite('xcodebuild', ['test', '-scheme', 'TruvideoSdk']),
        unit: suite('npm', ['test']),
      },
      workingDirectory: '/tmp/repo',
    })

    expect(results).toEqual([
      {
        command: 'xcodebuild test -scheme TruvideoSdk',
        exitCode: 70,
        suiteId: 'TruvideoSdk',
        summary: expect.stringContaining('Unable to find a destination'),
      },
      {
        command: 'npm test',
        exitCode: 0,
        suiteId: 'unit',
        summary: 'ok',
      },
    ])
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[0]).toBe('npm')
    expect(spawnMock.mock.calls[0]?.[1]).toEqual(['test'])
  })

  it('does not resolve a simulator when no suite needs an iOS destination', async () => {
    await runner.run({
      signal: new AbortController().signal,
      suites: { unit: suite('npm', ['test']) },
      workingDirectory: '/tmp/repo',
    })

    expect(resolveMock).not.toHaveBeenCalled()
  })

  it('rejects suite working directories that escape the repository root', async () => {
    await expect(
      runner.run({
        signal: new AbortController().signal,
        suites: {
          unit: {
            arguments: ['test'],
            executable: 'npm',
            workingDirectory: '../outside',
          },
        },
        workingDirectory: '/tmp/repo',
      }),
    ).rejects.toThrow(/outside the repository/)

    await expect(
      runner.run({
        signal: new AbortController().signal,
        suites: {
          unit: {
            arguments: ['test'],
            executable: 'npm',
            workingDirectory: '/absolute',
          },
        },
        workingDirectory: '/tmp/repo',
      }),
    ).rejects.toThrow(/outside the repository/)
  })

  it('rethrows cancellation while resolving an iOS simulator destination', async () => {
    const controller = new AbortController()
    const abortError = new Error('aborted')
    abortError.name = 'AbortError'
    resolveMock.mockImplementation(async () => {
      controller.abort()
      throw abortError
    })

    await expect(
      runner.run({
        signal: controller.signal,
        suites: {
          TruvideoSdk: suite('xcodebuild', ['test', '-scheme', 'TruvideoSdk']),
        },
        workingDirectory: '/tmp/repo',
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('buildSuiteProcessEnv', () => {
  it('mirrors non-blank Truvideo tokens as TEST_RUNNER_ keys for XCTest', () => {
    expect(
      buildSuiteProcessEnv({
        PATH: '/usr/bin',
        TRUVIDEO_ACCESS_TOKEN: '  access  ',
        TRUVIDEO_REFRESH_TOKEN: 'refresh',
      }),
    ).toEqual({
      PATH: '/usr/bin',
      TEST_RUNNER_TRUVIDEO_ACCESS_TOKEN: 'access',
      TEST_RUNNER_TRUVIDEO_REFRESH_TOKEN: 'refresh',
      TRUVIDEO_ACCESS_TOKEN: '  access  ',
      TRUVIDEO_REFRESH_TOKEN: 'refresh',
    })
  })

  it('skips blank Truvideo tokens', () => {
    expect(
      buildSuiteProcessEnv({
        TRUVIDEO_ACCESS_TOKEN: '   ',
        TRUVIDEO_REFRESH_TOKEN: undefined,
      }),
    ).toEqual({
      TRUVIDEO_ACCESS_TOKEN: '   ',
      TRUVIDEO_REFRESH_TOKEN: undefined,
    })
  })
})
