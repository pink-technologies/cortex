// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraIssue } from '@cortex/integrations/jira'

/**
 * Builds the user context block for ticket classification.
 *
 * @param issue - Jira issue to classify.
 * @param areaCatalog - Optional allowlisted area labels for this project.
 */
export function buildJiraClassifyUserContext(
  issue: JiraIssue,
  areaCatalog: readonly string[] = [],
): string {
  const areasSection =
    areaCatalog.length === 0
      ? [
          '- Set "areas" to an empty array when no project area catalog is configured.',
        ]
      : [
          `- Known areas for this project (pick zero or more; prefer [] if unsure): ${areaCatalog.join(', ')}.`,
          '- Only use area labels from that list (or leave areas empty). Do not invent packages, schemes, or shell commands.',
        ]

  return [
    '## Jira issue',
    '',
    `- Key: ${issue.key}`,
    `- Type: ${issue.issueType}`,
    `- Summary: ${issue.summary}`,
    `- Labels: ${issue.labels.length > 0 ? issue.labels.join(', ') : '(none)'}`,
    '',
    '### Description',
    '',
    issue.descriptionText || '(empty)',
    '',
    'Classify this ticket. Respond with a single JSON object only:',
    '',
    '```json',
    '{',
    '  "class": "bug" | "chore" | "question" | "out_of_scope",',
    '  "confidence": 0.0,',
    '  "automationEligible": true,',
    '  "areas": ["AreaLabel"],',
    '  "rationale": "string"',
    '}',
    '```',
    '',
    'Rules:',
    '- Set class from the ticket intent; do not guess whether suites can reproduce it.',
    '- Set automationEligible to true for concrete bugs and false otherwise (the Node may overwrite this after evidence-based repro).',
    '- Prefer out_of_scope when the request needs product/design decisions or human judgment only.',
    '- Infer areas only from clear product/module language in the ticket; leave areas empty when unclear.',
    ...areasSection,
  ].join('\n')
}

/**
 * Builds the repro-authoring prompt when allowlisted suites are initially green.
 */
export function buildJiraReproPrompt(input: {
  readonly issue: JiraIssue
  readonly skillPrompts: readonly string[]
  readonly suiteCommands: readonly { readonly command: string; readonly suiteId: string }[]
  readonly systemPrompt: string
}): string {
  const skills =
    input.skillPrompts.length === 0
      ? ''
      : ['## Skills', '', ...input.skillPrompts.map((prompt) => prompt.trim()), ''].join('\n')

  const suites =
    input.suiteCommands.length === 0
      ? '- (none configured)'
      : input.suiteCommands.map((suite) => `- ${suite.suiteId}: \`${suite.command}\``).join('\n')

  return [
    input.systemPrompt.trim(),
    '',
    skills,
    '## Task',
    '',
    `Author a minimal failing regression for Jira ${input.issue.key}: ${input.issue.summary}`,
    '',
    '### Description',
    '',
    input.issue.descriptionText || '(empty)',
    '',
    '### Allowlisted suites Cortex will re-run (do not invent other shell commands)',
    '',
    suites,
    '',
    'Add or adjust tests so one of those suites fails if the bug is real.',
    'Do not change product code to “fix” the bug. Do not push or open a PR.',
    'When done, reply with a short JSON object only:',
    '',
    '```json',
    '{ "summary": "what test you added", "succeeded": true }',
    '```',
  ]
    .filter((part) => part !== undefined)
    .join('\n')
}

/**
 * Builds the fix prompt for the coder agent after a reproduced failure.
 */
export function buildJiraFixPrompt(input: {
  readonly failingSummary: string
  readonly issue: JiraIssue
  readonly skillPrompts: readonly string[]
  readonly systemPrompt: string
}): string {
  const skills =
    input.skillPrompts.length === 0
      ? ''
      : ['## Skills', '', ...input.skillPrompts.map((prompt) => prompt.trim()), ''].join('\n')

  return [
    input.systemPrompt.trim(),
    '',
    skills,
    '## Task',
    '',
    `Fix the bug described by Jira ${input.issue.key}: ${input.issue.summary}`,
    '',
    '### Description',
    '',
    input.issue.descriptionText || '(empty)',
    '',
    '### Failing test evidence',
    '',
    input.failingSummary,
    '',
    'Make the smallest correct change. Do not push or open a PR yourself.',
    'When done, reply with a short JSON object only:',
    '',
    '```json',
    '{ "summary": "what you changed", "succeeded": true }',
    '```',
  ]
    .filter((part) => part !== undefined)
    .join('\n')
}

/**
 * Composes classify prompt from agent system prompt + skills + user context.
 */
export function composeJiraClassifyPrompt(input: {
  readonly skillPrompts: readonly string[]
  readonly systemPrompt: string
  readonly userContext: string
}): string {
  const skills =
    input.skillPrompts.length === 0
      ? ''
      : ['## Skills', '', ...input.skillPrompts.map((prompt) => prompt.trim()), ''].join('\n')

  return [input.systemPrompt.trim(), '', skills, input.userContext.trim()].join('\n')
}
