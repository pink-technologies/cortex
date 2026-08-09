// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraTriageTestSuiteResult } from '@cortex/protocol'
import {
  hasUnrunnableSuiteFailure,
  isUnrunnableSuiteFailure,
} from '../../../../src/handlers/jira-triage/runner/is-unrunnable-suite-failure'

function suite(
  overrides: Partial<JiraTriageTestSuiteResult> & Pick<JiraTriageTestSuiteResult, 'suiteId'>,
): JiraTriageTestSuiteResult {
  return {
    command: 'xcodebuild test -scheme Example',
    exitCode: 1,
    ...overrides,
  }
}

describe('isUnrunnableSuiteFailure', () => {
  it('returns false for green suites', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({ exitCode: 0, suiteId: 'unit', summary: 'BUILD FAILED' }),
      ),
    ).toBe(false)
  })

  it('returns false when exitCode is missing (treated as success)', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          exitCode: undefined,
          suiteId: 'unit',
          summary: 'BUILD FAILED',
        }),
      ),
    ).toBe(false)
  })

  it('returns true when summary is missing or blank so repro is not claimed', () => {
    expect(isUnrunnableSuiteFailure(suite({ suiteId: 'unit' }))).toBe(true)
    expect(
      isUnrunnableSuiteFailure(suite({ suiteId: 'unit', summary: '   ' })),
    ).toBe(true)
  })

  it('detects xcodebuild compile failures', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'TruVideoSdkCore',
          summary: 'error: cannot find type Foo\n** BUILD FAILED **',
        }),
      ),
    ).toBe(true)
  })

  it('detects testing cancelled because the build failed', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'TruvideoSdk',
          summary: 'Testing cancelled because the build failed.',
        }),
      ),
    ).toBe(true)
  })

  it('detects SwiftLint violations that fail the build before XCTest', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'TruvideoSdk',
          summary:
            'SyncPartOperationTests.swift:80:63: error: Force Unwrapping Violation: Force unwrapping should be avoided (force_unwrapping)',
        }),
      ),
    ).toBe(true)
  })

  it('detects missing destinations / schemes', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'camera',
          summary: 'xcodebuild: error: Unable to find a destination matching the provided destination specifier',
        }),
      ),
    ).toBe(true)
  })

  it('detects npm ENOENT without test failure markers', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          command: 'npm test',
          suiteId: 'unit',
          summary: 'npm ERR! code ENOENT\nnpm ERR! path /tmp/repo/package.json',
        }),
      ),
    ).toBe(true)
  })

  it('treats assertion failures as reproduced (not suite_broken)', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'unit',
          summary: "Test Case '-[FooTests testBar]' failed\nXCTAssertEqual failed",
        }),
      ),
    ).toBe(false)
  })

  it('does not treat fixture ENOENT with FAIL as suite_broken', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          command: 'npm test',
          suiteId: 'unit',
          summary: 'FAIL src/foo.test.ts\nENOENT: no such file or directory, open fixture.json',
        }),
      ),
    ).toBe(false)
  })

  it('prefers suite_broken when BUILD FAILED appears with assertion-like text', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'core',
          summary: 'Expected: true\n** BUILD FAILED **',
        }),
      ),
    ).toBe(true)
  })

  it('prefers suite_broken for scheme/destination/compile markers with assertion-like text', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'camera',
          summary:
            'Expected: true\nxcodebuild: error: Scheme Foo is not currently configured for the test action',
        }),
      ),
    ).toBe(true)
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'camera',
          summary:
            'Expected: true\nxcodebuild: error: The project does not contain a scheme named Bar',
        }),
      ),
    ).toBe(true)
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'camera',
          summary: 'Received: false\nUnable to find a destination for the chosen device',
        }),
      ),
    ).toBe(true)
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'camera',
          summary: 'FAIL FooTests\nCompilation failed',
        }),
      ),
    ).toBe(true)
  })

  it('treats weak infra markers with test failures as reproduced', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          suiteId: 'unit',
          summary: 'FAIL bar.test.ts\nno such module: MissingKit',
        }),
      ),
    ).toBe(false)
  })

  it('does not claim repro for truncated package-resolve logs with no test evidence', () => {
    expect(
      isUnrunnableSuiteFailure(
        suite({
          exitCode: 2,
          suiteId: 'TruvideoSdk',
          summary: [
            'Checking SwiftFormat and SwiftLint...',
            'xcodegen',
            'Resolve Package Graph',
            'Fetching from https://github.com/Truvideo/truvideo-sdk-ios-common (cached)',
            'Creating working copy of package ‘truvideo-sdk-ios-common’',
            'Checking out 0.0.79 of package ‘truvideo-sdk-ios-common’',
          ].join('\n'),
        }),
      ),
    ).toBe(true)
  })
})

describe('hasUnrunnableSuiteFailure', () => {
  it('returns true when any suite is unrunnable', () => {
    expect(
      hasUnrunnableSuiteFailure([
        suite({
          exitCode: 1,
          suiteId: 'unit',
          summary: 'Test Case failed\nXCTAssert',
        }),
        suite({
          exitCode: 1,
          suiteId: 'core',
          summary: '** BUILD FAILED **',
        }),
      ]),
    ).toBe(true)
  })

  it('returns false when only assertion failures are present', () => {
    expect(
      hasUnrunnableSuiteFailure([
        suite({
          suiteId: 'unit',
          summary: 'FAIL foo.test.ts\nExpected: 1\nReceived: 2',
        }),
      ]),
    ).toBe(false)
  })
})
