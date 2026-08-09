// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { SkillDefinition } from '../../../src/skills/models'
import { SkillSelector } from '../../../src/skills/selector'

function skill(
  id: string,
  description: string,
  keywords?: readonly string[],
): SkillDefinition {
  return {
    description,
    id,
    ...(keywords ? { keywords } : {}),
    prompt: `prompt:${id}`,
  }
}

describe('SkillSelector', () => {
  const selector = new SkillSelector()

  it('returns all skills sorted by id when count is within the limit', () => {
    const selected = selector.select({
      context: 'anything',
      skills: [skill('b', 'Second'), skill('a', 'First')],
    })

    expect(selected.map((entry) => entry.id)).toEqual(['a', 'b'])
  })

  it('returns an empty list when there are no skills or maxSkills is zero', () => {
    expect(selector.select({ context: 'x', skills: [] })).toEqual([])
    expect(
      selector.select({
        context: 'review pull request',
        maxSkills: 0,
        skills: [skill('code-review-diff', 'Diff review')],
      }),
    ).toEqual([])
  })

  it('ranks by overlap against id, description, and keywords', () => {
    const selected = selector.select({
      context: 'Classify this Jira bug and run triage',
      maxSkills: 2,
      skills: [
        skill('code-review-diff', 'Review pull request diffs', ['pull', 'request']),
        skill('jira-triage-classify', 'Classify Jira issues for triage', [
          'jira',
          'bug',
          'triage',
        ]),
        skill('unrelated-skill', 'Something else entirely', ['weather']),
      ],
    })

    expect(selected.map((entry) => entry.id)).toEqual([
      'jira-triage-classify',
      'code-review-diff',
    ])
  })

  it('breaks score ties by skill id', () => {
    const selected = selector.select({
      context: 'shared token',
      maxSkills: 1,
      skills: [
        skill('zeta', 'shared token'),
        skill('alpha', 'shared token'),
      ],
    })

    expect(selected.map((entry) => entry.id)).toEqual(['alpha'])
  })

  it('scores zero-overlap skills last when context has tokens', () => {
    const selected = selector.select({
      context: 'repository review pull request',
      maxSkills: 1,
      skills: [
        skill('weather', 'Forecast helpers'),
        skill('code-review-diff', 'Repository pull request review'),
      ],
    })

    expect(selected[0]?.id).toBe('code-review-diff')
  })

  it('treats empty context as zero relevance and keeps id order among ties', () => {
    const selected = selector.select({
      context: '   ',
      maxSkills: 2,
      skills: [
        skill('zeta', 'Z skill'),
        skill('alpha', 'A skill'),
        skill('mid', 'M skill'),
      ],
    })

    expect(selected.map((entry) => entry.id)).toEqual(['alpha', 'mid'])
  })
})
