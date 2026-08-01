// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind } from '@cortex/protocol'
import type { NodeConfiguration } from './node-configuration'

/**
 * Ensures the Node has the secrets required to process `jira.triage` jobs when
 * that kind is advertised.
 *
 * @param configuration - Validated Node configuration.
 * @param supportedKinds - Job kinds this Node advertises.
 */
export function assertJiraTriageRuntimeReady(
  configuration: NodeConfiguration,
  supportedKinds: readonly string[],
): void {
  if (!supportedKinds.includes(JiraTriageJobKind)) {
    return
  }

  if (configuration.jiraConnections.length === 0) {
    throw new Error(
      'CORTEX_JIRA_CONNECTIONS must include at least one Jira connection because this Node advertises jira.triage.',
    )
  }

  if (configuration.sourceControlConnections.length === 0) {
    throw new Error(
      'CORTEX_SC_CONNECTIONS must include at least one GitHub connection because jira.triage clones repositories.',
    )
  }

  if (!configuration.cursorApiKey) {
    throw new Error(
      'CURSOR_API_KEY is required because this Node advertises jira.triage.',
    )
  }
}
