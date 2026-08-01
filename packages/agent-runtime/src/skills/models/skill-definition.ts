// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Describes one skill available to Cortex agents.
 *
 * Skills are prompt packages that extend an agent's system instructions when
 * authorized by the execution scope. They carry metadata and body text only.
 * Authorization (which skills an agent may use) is separate from injection
 * (which skill prompts are appended to a given run)—see {@link SkillSelector}.
 */
export interface SkillDefinition {
  /**
   * Human-readable explanation of what the skill provides.
   */
  readonly description: string

  /**
   * Stable identifier agents use to reference the skill (for example
   * `code-review-diff`).
   */
  readonly id: string

  /**
   * Optional search tokens used by {@link SkillSelector} for relevance ranking.
   */
  readonly keywords?: readonly string[]

  /**
   * Prompt body appended when the skill is selected for a run.
   */
  readonly prompt: string
}
