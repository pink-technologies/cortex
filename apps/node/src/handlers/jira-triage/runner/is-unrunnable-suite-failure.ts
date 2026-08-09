// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraTriageTestSuiteResult } from '@cortex/protocol'

/**
 * Strong signals that the suite never reached meaningful test execution
 * (compile/link failure, missing scheme/simulator, missing toolchain, etc.).
 */
const UNRUNNABLE_PATTERNS: readonly RegExp[] = [
  /\bBUILD FAILED\b/i,
  /Testing cancelled because the build failed/i,
  /\bxcodebuild:\s*error:/i,
  /Unable to find a destination/i,
  /is not currently configured for the .+ scheme/i,
  /does not contain a scheme named/i,
  /Unable to boot (the )?Simulator/i,
  /\bno such module\b/i,
  /\bCompileSwift(Sources)? failed\b/i,
  /\blinker command failed\b/i,
  /\bCompilation failed\b/i,
  /: error: .+ Violation:/i,
  /\bForce (Unwrapping|Cast|Try) Violation\b/i,
  /\berror TS\d+\b/,
  /\bnpm ERR!\b/i,
  /\bENOENT\b/,
  /\bcommand not found\b/i,
  /Could not (read|find) package\.json/i,
  /No such file or directory/i,
]

/**
 * Signals that at least one test assertion ran and failed.
 */
const TEST_FAILURE_PATTERNS: readonly RegExp[] = [
  /Test Case .+ failed/i,
  /\bXCTAssert\b/,
  /\bAssertionError\b/,
  /\bFAIL\s+\S+/m,
  /\d+\s+failed,\s*\d+\s+passed/i,
  /failed \(\d+ failures?\)/i,
  /Expected:|Received:/,
  /Executed \d+ tests?, with \d+ failure/i,
]

/**
 * When assertion-like text is also present, only these markers still mean
 * the suite never became a trustworthy repro signal.
 */
const STRONG_UNRUNNABLE_WHEN_MIXED: readonly RegExp[] = [
  /\bBUILD FAILED\b/i,
  /Testing cancelled because the build failed/i,
  /\bxcodebuild:\s*error:/i,
  /Unable to find a destination/i,
  /is not currently configured for the .+ scheme/i,
  /\bCompilation failed\b/i,
  /: error: .+ Violation:/i,
]

/**
 * Returns whether a failing suite looks like build/infra rather than a
 * reproduced product bug.
 *
 * Requires positive test-failure evidence before a red suite can count as a
 * repro. Non-zero exits with only build/package/lint output (or no summary)
 * are treated as `suite_broken`, so finish comments do not claim the issue was
 * recreated when XCTest never ran.
 *
 * @param suite - Allowlisted suite outcome from {@link TestRunner}.
 * @returns `true` when the suite could not run tests meaningfully.
 */
export function isUnrunnableSuiteFailure(suite: JiraTriageTestSuiteResult): boolean {
  if ((suite.exitCode ?? 0) === 0) {
    return false
  }

  const summary = suite.summary?.trim()
  if (!summary) {
    // No log evidence that tests ran — do not claim a product repro.
    return true
  }

  const looksLikeTestFailure = TEST_FAILURE_PATTERNS.some((pattern) => pattern.test(summary))
  const hasStrongUnrunnable = STRONG_UNRUNNABLE_WHEN_MIXED.some((pattern) => pattern.test(summary))

  if (looksLikeTestFailure && !hasStrongUnrunnable) {
    return false
  }

  if (UNRUNNABLE_PATTERNS.some((pattern) => pattern.test(summary))) {
    return true
  }

  // Red exit without assertion/execution evidence (for example truncated
  // xcodebuild package-resolve logs) is not a trustworthy repro.
  return !looksLikeTestFailure
}

/**
 * Returns whether any failing suite in a batch is unrunnable.
 *
 * @param suites - Suite outcomes from a triage run.
 * @returns `true` when at least one failing suite is build/infra broken.
 */
export function hasUnrunnableSuiteFailure(
  suites: readonly JiraTriageTestSuiteResult[],
): boolean {
  return suites.some((suite) => isUnrunnableSuiteFailure(suite))
}
