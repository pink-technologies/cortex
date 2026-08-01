// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { SkillDefinition } from '../models/skill-definition'

/**
 * Options for {@link SkillSelector.select}.
 */
export interface SkillSelectorOptions {
  /**
   * Skills already authorized for the execution (allowlist).
   */
  readonly skills: readonly SkillDefinition[]

  /**
   * Run context used for relevance ranking (user prompt, job context, etc.).
   */
  readonly context: string

  /**
   * Maximum number of skills to inject (default `3`).
   *
   * When `skills.length` is less than or equal to this value, every authorized
   * skill is returned without ranking.
   */
  readonly maxSkills?: number
}

/**
 * Selects a subset of authorized skills for prompt injection.
 *
 * Discovery/authorization stays on the agent allowlist; this selector only
 * decides which skill prompts enter the composed prompt for one run, scoring
 * by token overlap against id, description, and keywords.
 */
export class SkillSelector {
  /**
   * Default maximum skills injected per run.
   */
  static readonly DEFAULT_MAX_SKILLS = 3

  // MARK: - Instance methods

  /**
   * Ranks authorized skills and returns the top matches.
   *
   * @param options - Authorized skills, context, and injection limit.
   * @returns Selected skills in descending relevance order.
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

    const contextTokens = tokenize(options.context)

    return skills
      .map((skill) => ({
        skill,
        score: scoreSkill(skill, contextTokens),
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
}

// MARK: - Private helpers

function scoreSkill(
  skill: SkillDefinition,
  contextTokens: ReadonlySet<string>,
): number {
  if (contextTokens.size === 0) {
    return 0
  }

  const haystack = tokenize(
    [skill.id, skill.description, ...(skill.keywords ?? [])].join(' '),
  )

  let score = 0
  for (const token of haystack) {
    if (contextTokens.has(token)) {
      score += 1
    }
  }

  return score
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length > 0),
  )
}
