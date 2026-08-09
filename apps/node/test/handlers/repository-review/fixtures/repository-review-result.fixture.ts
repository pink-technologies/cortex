// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { RepositoryReviewJobResult } from '@cortex/protocol'

/**
 * Builds a minimal valid repository review result for tests.
 */
export function repositoryReviewResult(
  overrides: Partial<RepositoryReviewJobResult> = {},
): RepositoryReviewJobResult {
  return {
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
    ...overrides,
  }
}
