// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { RepositoryReviewJobResult } from '@cortex/protocol'

/**
 * Formats a completed repository review as a pull-request comment body.
 *
 * Preserves multi-paragraph Markdown in finding fields (including fenced code
 * proposals) so architecture-depth reviews remain readable on the provider.
 *
 * @param result - Validated review result from the execution engine.
 * @returns Markdown suitable for an issue/pull-request comment.
 */
export function formatRepositoryReviewComment(result: RepositoryReviewJobResult): string {
  const strengths =
    result.strengths.length === 0
      ? '_None recorded._'
      : result.strengths.map((item) => `- ${item}`).join('\n')

  const findings =
    result.findings.length === 0
      ? '_No findings._'
      : result.findings
          .map((finding) => {
            const location = finding.location
              ? ` (\`${finding.location.path}\`:${finding.location.line})`
              : ''
            const evidence =
              finding.evidence.length === 0
                ? '_None._'
                : finding.evidence.map((item) => `- ${item}`).join('\n')
            const verification =
              finding.verification.length === 0
                ? '_None._'
                : finding.verification.map((item) => `- ${item}`).join('\n')

            const ruleIds =
              finding.ruleIds.length === 0
                ? undefined
                : `- **rules:** ${finding.ruleIds.map((id) => `\`${id}\``).join(', ')}`

            return [
              `#### [${finding.severity}/${finding.disposition}] ${finding.title}${location}`,
              '',
              `- **id:** \`${finding.id}\``,
              `- **category:** ${finding.category}`,
              `- **confidence:** ${finding.confidence}`,
              ...(ruleIds ? [ruleIds] : []),
              '',
              '**Problem**',
              '',
              finding.problem.trim(),
              '',
              '**Impact**',
              '',
              finding.impact.trim(),
              '',
              '**Evidence**',
              '',
              evidence,
              '',
              '**Recommendation**',
              '',
              finding.recommendation.trim(),
              '',
              '**Verification**',
              '',
              verification,
            ].join('\n')
          })
          .join('\n\n')

  const listOrNone = (items: readonly string[]): string =>
    items.length === 0 ? '_None._' : items.map((item) => `- ${item}`).join('\n')

  const scoreSection =
    result.score === undefined
      ? []
      : [
          '### Project rule score',
          '',
          `**${(result.score.value * 100).toFixed(1)}%** — ${result.score.summary}`,
          '',
        ]

  const ruleOutcomesSection =
    result.ruleOutcomes.length === 0
      ? []
      : [
          '### Project rule outcomes',
          '',
          ...result.ruleOutcomes.map((outcome) => {
            const findings =
              outcome.findingIds.length === 0
                ? ''
                : ` (findings: ${outcome.findingIds.map((id) => `\`${id}\``).join(', ')})`
            const reason = outcome.reason ? ` — ${outcome.reason}` : ''
            return `- \`${outcome.ruleId}\`: **${outcome.status}**${findings}${reason}`
          }),
          '',
        ]

  return [
    `## Cortex repository review (${result.decision})`,
    '',
    result.summary.trim(),
    '',
    ...scoreSection,
    ...ruleOutcomesSection,
    '### Strengths',
    '',
    strengths,
    '',
    '### Findings',
    '',
    findings,
    '',
    '### Validation',
    '',
    '**Performed**',
    '',
    listOrNone(result.validation.performed),
    '',
    '**Not performed**',
    '',
    listOrNone(result.validation.notPerformed),
    '',
    '### Applied policies',
    '',
    listOrNone(result.appliedPolicies),
    '',
    '### Applied skills',
    '',
    listOrNone(result.appliedSkills),
    '',
    '### Limitations',
    '',
    listOrNone(result.limitations),
  ].join('\n')
}
