// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  buildJiraClassifyUserContext,
  buildJiraFixPrompt,
  buildJiraReproPrompt,
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
      ['App', 'Camera'],
    )

    expect(userContext).toContain('JC-1')
    expect(userContext).toContain('do not guess whether suites can reproduce')
    expect(userContext).toContain('Known areas for this project')
    expect(userContext).toContain('App, Camera')
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
    expect(emptyContext).toContain('no project area catalog')
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

  it('builds a repro-authoring prompt with allowlisted suite commands', () => {
    const prompt = buildJiraReproPrompt({
      issue: issue({
        descriptionText: 'details',
        key: 'JC-4',
        summary: 'Bug',
      }),
      skillPrompts: ['Keep tests focused.'],
      suiteCommands: [
        { command: 'npm test', suiteId: 'unit' },
        { command: 'npx playwright test', suiteId: 'ui' },
      ],
      systemPrompt: 'You are coder.',
    })

    expect(prompt).toContain('JC-4')
    expect(prompt).toContain('npm test')
    expect(prompt).toContain('npx playwright test')
    expect(prompt).toContain('Keep tests focused.')
    expect(prompt).toContain('do not invent other shell commands')
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

    expect(
      buildJiraReproPrompt({
        issue: issue({ key: 'JC-5' }),
        skillPrompts: [],
        suiteCommands: [],
        systemPrompt: 'You are coder.',
      }),
    ).not.toContain('## Skills')
  })
})
