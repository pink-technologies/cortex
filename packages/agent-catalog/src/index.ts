// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { join } from 'node:path'

/**
 * Absolute filesystem roots for an on-disk agent catalog.
 *
 * Each directory is the load root for that catalog kind (agent definitions,
 * capability definitions, and skill definitions). Callers pass these paths to
 * runtime bootstrap/loaders; this type does not load or validate manifests.
 */
export interface AgentCatalogDirectories {
  /**
   * Absolute path to the directory of agent definition manifests.
   */
  readonly agentsDirectory: string

  /**
   * Absolute path to the directory of capability definition manifests.
   */
  readonly capabilitiesDirectory: string

  /**
   * Absolute path to the directory of skill definition manifests.
   */
  readonly skillsDirectory: string
}

const resourcesDirectory = join(__dirname, '../resources')

/**
 * Bundled catalog directories shipped with `@cortex/agent-catalog`.
 *
 * Resolves absolute paths under this package's `resources/` tree
 * (`agents`, `capabilities`, `skills`). The object is frozen; consumers should
 * treat the paths as read-only load roots for runtime bootstrap.
 */
export const bundledAgentCatalog: AgentCatalogDirectories = Object.freeze({
  agentsDirectory: join(resourcesDirectory, 'agents'),
  capabilitiesDirectory: join(resourcesDirectory, 'capabilities'),
  skillsDirectory: join(resourcesDirectory, 'skills'),
})
