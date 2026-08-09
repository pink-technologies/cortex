// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraWebhookRoute } from './jira-webhook-route'
import { jiraTriageRoute } from './jira-triage/jira-triage.route'

/**
 * Registered Jira webhook routes keyed by {@link JiraWebhookRoute.name}.
 *
 * Add new product intents by exporting a route and registering it here.
 * Callers resolve a route by name, filter on its `events`, then call `handle`.
 */
export const JIRA_WEBHOOK_ROUTES: ReadonlyMap<string, JiraWebhookRoute> = new Map([
  [jiraTriageRoute.name, jiraTriageRoute],
])
