// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  buildRepositoryReviewUserContext,
  composeRepositoryReviewPrompt,
} from '../../../../src/handlers/repository-review/composer/repository-review-prompt-composer'

describe('repository-review prompt composer', () => {
  it('includes merge-base guidance when available', () => {
    const context = buildRepositoryReviewUserContext({
      baseRef: 'main',
      headRef: 'feature',
      mergeBaseSha: 'abc123',
      reviewMode: 'diff',
    })

    expect(context).toContain('Base revision: main.')
    expect(context).toContain('Merge base SHA: abc123.')
    expect(context).toContain('abc123...HEAD')
  })

  it('reports unresolved merge-base when baseRef is present without a SHA', () => {
    const context = buildRepositoryReviewUserContext({
      baseRef: 'main',
      headRef: 'feature',
      reviewMode: 'diff',
    })

    expect(context).toContain('Merge base could not be resolved locally')
  })

  it('composes system prompt, skills, guidelines, applicable rules, and user context', () => {
    const prompt = composeRepositoryReviewPrompt({
      applicableRulesPrompt:
        '## Applicable project rules (host checklist)\n\n- `TV-TEST-051` [high] — Element type',
      guidelinesPrompt: '## Repository agent guidelines\n\n### AGENTS.md\n\nPrefer early returns.',
      skillPrompts: ['Focus on the change set.'],
      systemPrompt: 'You are the repository reviewer.',
      userContext: '## Review run context\nHead revision: feature.',
    })

    expect(prompt).toContain('You are the repository reviewer.')
    expect(prompt).toContain('## Authorized skill')
    expect(prompt).toContain('Focus on the change set.')
    expect(prompt).toContain('## Repository agent guidelines')
    expect(prompt).toContain('Prefer early returns.')
    expect(prompt).toContain('## Applicable project rules (host checklist)')
    expect(prompt).toContain('`TV-TEST-051`')
    expect(prompt).toContain('Head revision: feature.')
  })
})
