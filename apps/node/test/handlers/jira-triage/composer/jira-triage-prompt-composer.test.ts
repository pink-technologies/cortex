// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  buildJiraClassifyUserContext,
  buildJiraFixPrompt,
  composeJiraClassifyPrompt,
} from '../../../../src/handlers/jira-triage/composer/jira-triage-prompt-composer'
import { JiraIssue } from '@cortex/integrations/jira'

function issue(partial: {
  customFields?: Readonly<Record<string, unknown>>
  descriptionText?: string
  issueType?: string
  key?: string
  labels?: readonly string[]
  projectKey?: string
  summary?: string
} = {}): JiraIssue {
  return new JiraIssue(
    undefined,
    partial.customFields ?? {},
    partial.descriptionText ?? '',
    partial.issueType ?? 'Bug',
    partial.key ?? 'JC-1',
    partial.labels ?? [],
    partial.projectKey ?? 'JC',
    [],
    partial.summary ?? 'Bug',
  )
}

describe('jira triage prompt composer', () => {
  it('builds classify context and composes prompts', () => {
    const userContext = buildJiraClassifyUserContext(
      issue({
        descriptionText: 'NPE on save',
        key: 'JC-1',
        labels: ['crash'],
        summary: 'Crash',
      }),
    )

    expect(userContext).toContain('JC-1')
    expect(
      composeJiraClassifyPrompt({
        skillPrompts: ['Classify carefully.'],
        systemPrompt: 'You are QA.',
        userContext,
      }),
    ).toContain('Classify carefully.')

    const emptyContext = buildJiraClassifyUserContext(
      issue({
        descriptionText: '',
        key: 'JC-0',
        labels: [],
        summary: 'Empty',
      }),
    )
    expect(emptyContext).toContain('(none)')
    expect(emptyContext).toContain('(empty)')
  })

  it('builds a fix prompt for the coder agent', () => {
    const prompt = buildJiraFixPrompt({
      failingSummary: 'unit failed',
      issue: issue({
        descriptionText: 'details',
        key: 'JC-2',
        summary: 'Bug',
      }),
      skillPrompts: ['Keep fixes small.'],
      systemPrompt: 'You are coder.',
    })

    expect(prompt).toContain('JC-2')
    expect(prompt).toContain('Keep fixes small.')
  })

  it('omits skill sections when none are provided', () => {
    expect(
      composeJiraClassifyPrompt({
        skillPrompts: [],
        systemPrompt: 'You are QA.',
        userContext: 'context',
      }),
    ).not.toContain('## Skills')

    expect(
      buildJiraFixPrompt({
        failingSummary: 'fail',
        issue: issue({ key: 'JC-3' }),
        skillPrompts: [],
        systemPrompt: 'You are coder.',
      }),
    ).not.toContain('## Skills')
  })
})
