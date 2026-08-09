// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { SkillDefinition } from '../models/skill-definition'

/**
 * Inputs for {@link SkillSelector.select}.
 *
 * Authorization is the caller's responsibility: pass only skills already
 * allowed for the execution. This selector only chooses which of those skill
 * prompts are injected for one run.
 */
export interface SkillSelectorOptions {
  /**
   * Skills already authorized for the execution (allowlist).
   *
   * Empty input yields an empty selection. Order of this array is not
   * preserved in the result when ranking runs.
   */
  readonly skills: readonly SkillDefinition[]

  /**
   * Free-text run context used for relevance ranking.
   *
   * Typically the user prompt and/or job description. Tokens are matched
   * against each skill's {@link SkillDefinition.id},
   * {@link SkillDefinition.description}, and
   * {@link SkillDefinition.keywords}.
   */
  readonly context: string

  /**
   * Maximum number of skills to return (default
   * {@link SkillSelector.DEFAULT_MAX_SKILLS}).
   *
   * When `skills.length` is less than or equal to this value, every authorized
   * skill is returned without relevance ranking (sorted by `id`). Values
   * `<= 0` yield an empty selection.
   */
  readonly maxSkills?: number
}

/**
 * Chooses a subset of authorized skills for prompt injection on one run.
 *
 * Discovery and authorization stay outside this type (agent allowlist /
 * registry). Given an authorized list, the selector caps how many skill
 * prompts enter the composed system prompt so long allowlists do not flood
 * every execution.
 *
 * Ranking (when the allowlist is larger than the effective max) scores each
 * skill by case-insensitive token overlap between `context` and the skill's
 * id, description, and keywords. Higher scores win; ties break by ascending
 * `id`. The returned array is a new list and must not be mutated in place as
 * a shared catalog.
 */
export class SkillSelector {
  /**
   * Default maximum skills injected per run when {@link SkillSelectorOptions.maxSkills}
   * is omitted.
   */
  static readonly DEFAULT_MAX_SKILLS = 3

  // MARK: - Instance methods

  /**
   * Returns the skills to inject for the given run context.
   *
   * Behavior:
   * - empty allowlist or non-positive `maxSkills` → `[]`
   * - allowlist size ≤ `maxSkills` → all authorized skills, sorted by `id`
   * - otherwise → top `maxSkills` by relevance score, then `id`
   *
   * @param options - Authorized skills, ranking context, and injection limit.
   * @returns Selected skills in descending relevance order (or `id` order when
   *   ranking is skipped).
   */
  select(options: SkillSelectorOptions): readonly SkillDefinition[] {
    const maxSkills = options.maxSkills ?? SkillSelector.DEFAULT_MAX_SKILLS
    const skills = [...options.skills]

    if (skills.length === 0 || maxSkills <= 0) {
      return []
    }

    if (skills.length <= maxSkills) {
      return skills.sort((left, right) => left.id.localeCompare(right.id))
    }

    const tokens = this.tokenize(options.context)

    return skills
      .map((skill) => ({
        skill,
        score: this.scoreSkill(skill, tokens),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score
        }

        return left.skill.id.localeCompare(right.skill.id)
      })
      .slice(0, maxSkills)
      .map((entry) => entry.skill)
  }

  // MARK: - Private methods

  private scoreSkill(skill: SkillDefinition, contextTokens: ReadonlySet<string>): number {
    if (contextTokens.size === 0) {
      return 0
    }

    const haystack = this.tokenize([skill.id, skill.description, ...(skill.keywords ?? [])].join(' '))

    let score = 0

    for (const token of haystack) {
      if (contextTokens.has(token)) {
        score += 1
      }
    }

    return score
  }

  private tokenize(value: string): Set<string> {
    return new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter((token) => token.length > 0),
    )
  }
}
