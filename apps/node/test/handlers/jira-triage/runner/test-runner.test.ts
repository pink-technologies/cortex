// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

jest.mock('node:child_process', () => ({
  execFile: jest.fn((
    _file: string,
    _args: readonly string[],
    _options: unknown,
    callback: (error: Error | null, stdout: string, stderr: string) => void,
  ) => {
    callback(null, 'ok\n', '')
  }),
}))

import { execFile } from 'node:child_process'
import { TestRunner } from '../../../../src/handlers/jira-triage/runner/test-runner'

describe('TestRunner', () => {
  const execFileMock = execFile as unknown as jest.Mock
  const runner = new TestRunner()

  beforeEach(() => {
    execFileMock.mockReset()
    execFileMock.mockImplementation((
      _file: string,
      _args: readonly string[],
      _options: unknown,
      callback: (error: (Error & { code?: number; stdout?: string; stderr?: string }) | null, stdout: string, stderr: string) => void,
    ) => {
      callback(null, 'ok\n', '')
    })
  })

  it('reports dry-run suites without executing', () => {
    expect(runner.dryRun({ unit: 'npm test', ui: 'npx playwright test' })).toEqual([
      { command: 'npm test', suiteId: 'unit', summary: 'dry-run' },
      { command: 'npx playwright test', suiteId: 'ui', summary: 'dry-run' },
    ])
    expect(runner.dryRun({})).toEqual([])
    expect(execFileMock).not.toHaveBeenCalled()
  })


  it('runs allowlisted suites and captures failures', async () => {
    execFileMock
      .mockImplementationOnce((
        _file: string,
        _args: readonly string[],
        _options: unknown,
        callback: (error: null, stdout: string, stderr: string) => void,
      ) => {
        callback(null, 'pass\n', '')
      })
      .mockImplementationOnce((
        _file: string,
        _args: readonly string[],
        _options: unknown,
        callback: (
          error: (Error & { code?: number; stdout?: string; stderr?: string }) | null,
          stdout: string,
          stderr: string,
        ) => void,
      ) => {
        const error = new Error('failed') as Error & {
          code?: number
          stdout?: string
          stderr?: string
        }
        error.code = 1
        error.stdout = ''
        error.stderr = 'boom'
        callback(error, '', 'boom')
      })

    const results = await runner.run({
      signal: new AbortController().signal,
      suites: { unit: 'npm test', ui: 'npx playwright test' },
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
  })

  it('skips empty suite commands and truncates large output', async () => {
    execFileMock.mockImplementation((
      _file: string,
      _args: readonly string[],
      _options: unknown,
      callback: (error: null, stdout: string, stderr: string) => void,
    ) => {
      callback(null, `${'x'.repeat(2_500)}\n`, '')
    })

    const results = await runner.run({
      signal: new AbortController().signal,
      suites: { unit: 'npm test', ui: undefined },
      workingDirectory: '/tmp/repo',
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.summary?.endsWith('…')).toBe(true)
    expect(results[0]?.summary?.length).toBe(2_001)
  })
})

