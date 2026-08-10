// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ProjectReviewRule } from './repository-review-rule-catalog'

/**
 * Formats the applicable project-rule checklist for prompt injection.
 *
 * @param rules - Rules the host selected for this change set.
 * @returns Prompt section text, or `undefined` when the list is empty.
 */
export function formatRepositoryReviewApplicableRules(
  rules: readonly ProjectReviewRule[],
): string | undefined {
  if (rules.length === 0) {
    return undefined
  }

  const lines = [
    '## Applicable project rules (host checklist)',
    '',
    'The host parsed these project rule ids from repository guidelines/skills',
    'and selected them for this change set. You must:',
    '',
    '1. Cite matching ids in each finding via `ruleIds` when a finding maps to a rule.',
    '2. Emit exactly one `ruleOutcomes` entry for **every** id listed below.',
    '3. Use `fail` only when at least one finding cites that rule id (and list those finding ids).',
    '4. Use `pass` when you reviewed the rule against the change and found no violation.',
    '5. Use `not_reviewed` when the rule applies but you could not evaluate it; include a short `reason`.',
    '',
    'Do not invent rule ids outside this list. Do not omit any listed id from `ruleOutcomes`.',
    '',
  ]

  for (const rule of rules) {
    const severity = rule.severity === 'unknown' ? '' : ` [${rule.severity}]`
    lines.push(`- \`${rule.id}\`${severity} — ${rule.title} _(source: ${rule.sourcePath})_`)
  }

  return lines.join('\n')
}
