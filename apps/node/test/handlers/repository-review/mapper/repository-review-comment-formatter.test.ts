// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { formatRepositoryReviewComment } from '../../../../src/handlers'
import { repositoryReviewResult } from '../fixtures/repository-review-result.fixture'

describe('formatRepositoryReviewComment', () => {
  it('preserves multi-paragraph finding recommendation and proposed code fences', () => {
    const comment = formatRepositoryReviewComment(
      repositoryReviewResult({
        decision: 'request_changes',
        findings: [
          {
            category: 'api_design',
            confidence: 'high',
            disposition: 'required_before_merge',
            evidence: ['Sources/Appearance/CameraIcons.swift:89'],
            id: 'icon-api',
            impact: 'UIKit controls can render blank.',
            location: {
              line: 89,
              path: 'Sources/Appearance/CameraIcons.swift',
            },
            problem: 'Current IconImage forces partners to supply framework-specific images.',
            recommendation: [
              'Prefer a declarative descriptor:',
              '',
              '```swift',
              'extension CameraAppearance {',
              '  public struct Icon: Sendable {',
              '    public let source: Source',
              '    public let tint: Color?',
              '  }',
              '}',
              '```',
              '',
              'Resolve once into a non-optional internal `UIImage`.',
            ].join('\n'),
            ruleIds: [],
            severity: 'high',
            title: 'Replace IconImage with declarative CameraAppearance.Icon',
            verification: ['Invalid SF Symbol retains SDK default.'],
          },
        ],
        summary: 'Appearance redesign is coherent but the public icon layer needs a declarative rewrite.',
      }),
    )

    expect(comment).toContain('## Cortex repository review (request_changes)')
    expect(comment).toContain(
      '#### [high/required_before_merge] Replace IconImage with declarative CameraAppearance.Icon (`Sources/Appearance/CameraIcons.swift`:89)',
    )
    expect(comment).toContain('```swift')
    expect(comment).toContain('public struct Icon: Sendable')
    expect(comment).toContain('### Applied skills')
    expect(comment).toContain('code-review-diff')
  })

  it('renders project rule score, outcomes, and finding rule ids', () => {
    const comment = formatRepositoryReviewComment(
      repositoryReviewResult({
        decision: 'request_changes',
        findings: [
          {
            category: 'test_coverage',
            confidence: 'high',
            disposition: 'required_before_merge',
            evidence: ['UITests/PermissionsScreen.swift'],
            id: 'a11y-type',
            impact: 'UITest waits on the wrong element type.',
            problem: 'Exit confirmation uses a button query for a static text.',
            recommendation: 'Match the production a11y element type.',
            ruleIds: ['TV-TEST-051'],
            severity: 'high',
            title: 'Wrong a11y element type',
            verification: ['UITest asserts .staticText'],
          },
        ],
        ruleOutcomes: [
          {
            findingIds: ['a11y-type'],
            ruleId: 'TV-TEST-051',
            status: 'fail',
          },
          {
            findingIds: [],
            reason: 'No violation in changed screens.',
            ruleId: 'TV-TEST-050',
            status: 'pass',
          },
        ],
        score: {
          summary: 'Project-rule score over 2 applicable rule(s): 1 pass, 1 fail, 0 not_reviewed.',
          value: 0.45,
        },
        summary: 'UITest contracts need fixes.',
      }),
    )

    expect(comment).toContain('### Project rule score')
    expect(comment).toContain('**45.0%**')
    expect(comment).toContain('### Project rule outcomes')
    expect(comment).toContain('`TV-TEST-051`: **fail**')
    expect(comment).toContain('`TV-TEST-050`: **pass**')
    expect(comment).toContain('- **rules:** `TV-TEST-051`')
  })

  it('renders an empty findings list', () => {
    const comment = formatRepositoryReviewComment(
      repositoryReviewResult({
        decision: 'approve',
        summary: 'Clean review.',
      }),
    )

    expect(comment).toContain('_No findings._')
    expect(comment).toContain('## Cortex repository review (approve)')
  })

  it('renders strengths and findings without location/evidence/verification', () => {
    const comment = formatRepositoryReviewComment(
      repositoryReviewResult({
        decision: 'comment',
        strengths: ['Clear public API boundary'],
        findings: [
          {
            category: 'test_coverage',
            confidence: 'medium',
            disposition: 'follow_up',
            evidence: [],
            id: 'no-tests',
            impact: 'Regressions may land unnoticed.',
            problem: 'No coverage for the new resolver.',
            recommendation: 'Add unit tests for fallback behavior.',
            ruleIds: [],
            severity: 'medium',
            title: 'Add resolver regression tests',
            verification: [],
          },
        ],
        summary: 'Needs tests.',
      }),
    )

    expect(comment).toContain('- Clear public API boundary')
    expect(comment).toContain('#### [medium/follow_up] Add resolver regression tests')
    expect(comment).not.toContain('(`')
    expect(comment).toContain('**Evidence**')
    expect(comment).toContain('_None._')
    expect(comment).toContain('**Verification**')
  })
})
