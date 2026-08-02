// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraIssue } from '@cortex/integrations/jira'

/**
 * Builds the user context block for ticket classification.
 */
export function buildJiraClassifyUserContext(issue: JiraIssue): string {
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
    '  "rationale": "string"',
    '}',
    '```',
    '',
    'Rules:',
    '- automationEligible should be true only for actionable bugs Cortex can reproduce with tests.',
    '- Prefer out_of_scope when the request needs product/design decisions or human judgment only.',
  ].join('\n')
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
