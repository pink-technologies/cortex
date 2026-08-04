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
            category: 'testing',
            confidence: 'medium',
            disposition: 'follow_up',
            evidence: [],
            id: 'no-tests',
            impact: 'Regressions may land unnoticed.',
            problem: 'No coverage for the new resolver.',
            recommendation: 'Add unit tests for fallback behavior.',
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
