// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraConnection } from '@cortex/integrations/jira'

export type { JiraConnection }

/**
 * Resolves Node-local Jira connections by identifier.
 */
export interface JiraConnectionStore {
  /**
   * Resolves a configured connection.
   *
   * @param connectionId - Identifier from the job payload.
   * @returns The matching connection.
   * @throws When no connection is configured for the identifier.
   */
  resolve(connectionId: string): JiraConnection
}
