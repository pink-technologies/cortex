// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  buildRepositoryReviewUserContext,
  composeRepositoryReviewPrompt,
  mapRepositoryReviewResult,
} from '../../../../src/handlers'
import { repositoryReviewResult } from '../fixtures/repository-review-result.fixture'

describe('mapRepositoryReviewResult', () => {
  it('parses a fenced JSON review result', () => {
    const payload = repositoryReviewResult({
      decision: 'comment',
      findings: [
        {
          category: 'hardening',
          confidence: 'high',
          disposition: 'follow_up',
          evidence: ['src/main.ts:10 force unwrap'],
          id: 'finding-1',
          impact: 'Crash on nil input.',
          location: {
            line: 10,
            path: 'src/main.ts',
          },
          problem: 'Force unwrap on optional value.',
          recommendation: 'Use guard let and return a typed error.',
          ruleIds: [],
          severity: 'medium',
          title: 'Unsafe unwrap',
          verification: ['Unit test covering nil input.'],
        },
      ],
      summary: 'One finding found.',
    })

    const output = ['Here is the review:', '```json', JSON.stringify(payload), '```'].join('\n')

    expect(mapRepositoryReviewResult(output)).toEqual(payload)
  })

  it('parses fenced JSON when finding recommendations contain nested Markdown fences', () => {
    const recommendation = [
      'Prefer a declarative descriptor:',
      '',
      '```swift',
      'public struct Icon: Sendable {',
      '  public let source: Source',
      '}',
      '```',
      '',
      'Resolve once into UIImage.',
    ].join('\n')

    const payload = repositoryReviewResult({
      decision: 'request_changes',
      findings: [
        {
          category: 'api_design',
          confidence: 'high',
          disposition: 'required_before_merge',
          evidence: ['Sources/Appearance/CameraIcons.swift:89'],
          id: 'icon-api',
          impact: 'UIKit consumers can receive blank icons.',
          location: {
            line: 89,
            path: 'Sources/Appearance/CameraIcons.swift',
          },
          problem: 'IconImage forces framework-specific images.',
          recommendation,
          ruleIds: [],
          severity: 'high',
          title: 'Replace IconImage with declarative Icon',
          verification: ['Invalid SF Symbol retains SDK default.'],
        },
      ],
      summary: 'Public icon API needs a declarative rewrite.',
    })

    const output = ['```json', JSON.stringify(payload, null, 2), '```'].join('\n')

    expect(mapRepositoryReviewResult(output)).toEqual(payload)
  })

  it('rejects invalid JSON', () => {
    expect(() => mapRepositoryReviewResult('not-json')).toThrow(/not valid JSON/)
  })

  it('rejects JSON that fails the protocol schema', () => {
    expect(() =>
      mapRepositoryReviewResult(
        JSON.stringify({
          findings: [],
          summary: '',
        }),
      ),
    ).toThrow()
  })
})

describe('buildRepositoryReviewUserContext', () => {
  it('includes mode, refs, and instructions', () => {
    const context = buildRepositoryReviewUserContext({
      baseRef: 'main',
      headRef: 'feature',
      instructions: 'Focus on security.',
      pullRequestBody: 'Implements login.',
      pullRequestTitle: 'Add login',
      reviewMode: 'diff',
    })

    expect(context).toContain('Review mode: diff.')
    expect(context).toContain('Head revision: feature.')
    expect(context).toContain('Base revision: main.')
    expect(context).toContain('Focus on security.')
    expect(context).toContain('Implements login.')
    expect(context).toContain('Add login')
  })
})

describe('composeRepositoryReviewPrompt', () => {
  it('always includes the agent system prompt and user context', () => {
    const prompt = composeRepositoryReviewPrompt({
      systemPrompt: 'You are the repository reviewer.',
      userContext: 'Review mode: diff.',
    })

    expect(prompt).toContain('You are the repository reviewer.')
    expect(prompt).toContain('Review mode: diff.')
    expect(prompt).not.toContain('Repository agent guidelines')
  })

  it('injects guidelines and skill prompts when provided', () => {
    const prompt = composeRepositoryReviewPrompt({
      guidelinesPrompt: 'Prefer early returns.',
      skillPrompts: ['# Diff review skill\nFocus on the change set.'],
      systemPrompt: 'System',
      userContext: 'Context',
    })

    expect(prompt).toContain('Repository agent guidelines')
    expect(prompt).toContain('Prefer early returns.')
    expect(prompt).toContain('Authorized skill')
    expect(prompt).toContain('Focus on the change set.')
  })
})
