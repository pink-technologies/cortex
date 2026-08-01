// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind } from '@cortex/protocol'
import { assertJiraTriageRuntimeReady } from '../../src/configuration/assert-jira-triage-runtime-ready'
import type { NodeConfiguration } from '../../src/configuration'

function configuration(partial: Partial<NodeConfiguration> = {}): NodeConfiguration {
  return {
    apiURL: 'https://api.example',
    jiraConnections: [],
    jiraProjectRepos: [],
    llm: {},
    nodeId: 'n1',
    nodeName: 'n',
    pollingIntervalMilliseconds: 2000,
    sourceControlConnections: [],
    version: '1',
    ...partial,
  } as NodeConfiguration
}

describe('assertJiraTriageRuntimeReady', () => {
  it('no-ops when jira.triage is not advertised', () => {
    expect(() => assertJiraTriageRuntimeReady(configuration(), [])).not.toThrow()
  })

  it('requires Jira + GitHub connections and Cursor key', () => {
    expect(() =>
      assertJiraTriageRuntimeReady(configuration(), [JiraTriageJobKind]),
    ).toThrow(/CORTEX_JIRA_CONNECTIONS/)

    expect(() =>
      assertJiraTriageRuntimeReady(
        configuration({
          jiraConnections: [
            {
              apiToken: 't',
              baseUrl: 'https://example.atlassian.net',
              email: 'a@b.com',
              id: 'jira-main',
              provider: 'jira',
            },
          ],
        }),
        [JiraTriageJobKind],
      ),
    ).toThrow(/CORTEX_SC_CONNECTIONS/)

    expect(() =>
      assertJiraTriageRuntimeReady(
        configuration({
          jiraConnections: [
            {
              apiToken: 't',
              baseUrl: 'https://example.atlassian.net',
              email: 'a@b.com',
              id: 'jira-main',
              provider: 'jira',
            },
          ],
          sourceControlConnections: [{ id: 'g', provider: 'github', token: 'ghp' }],
        }),
        [JiraTriageJobKind],
      ),
    ).toThrow(/CURSOR_API_KEY/)
  })
})
