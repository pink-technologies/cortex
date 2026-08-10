// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeConfigurationError } from '../error/node-configuration-error'
import type { ConnectionsFile } from '../schemas/connections-file.schema'
import type { ProjectFile } from '../schemas/project-file.schema'

/**
 * One schema-validated project file with its source basename for error paths.
 *
 * {@link fileName} exists only so cross-file validation can cite the failing
 * TOML file. Mapping consumes {@link project} alone.
 */
export interface LoadedProject {
  /**
   * Basename of the project file (for example `cortex.toml`).
   */
  readonly fileName: string

  /**
   * Schema-validated project contents.
   */
  readonly project: ProjectFile
}

/**
 * Validates relationships that span connections and project files.
 *
 * Same-file rules (duplicate connection IDs, missing suite keys) belong in Zod
 * schemas. This step only checks cross-file references.
 *
 * @param input - Validated connections file and loaded projects.
 * @throws {NodeConfigurationError} When a cross-file rule fails.
 */
export function validateNodeConfiguration(input: {
  readonly connections: ConnectionsFile
  readonly projects: readonly LoadedProject[]
}): void {
  const sourceControlIds = new Set(
    input.connections.sourceControlConnections.map((connection) => connection.id),
  )
  const projectKeys = new Map<string, string>()

  for (const loaded of input.projects) {
    const existingFileName = projectKeys.get(loaded.project.projectKey)

    if (existingFileName) {
      throw new NodeConfigurationError(
        `projects/${loaded.fileName}:projectKey: Duplicate key ` +
          `"${loaded.project.projectKey}" (also defined in projects/${existingFileName}).`,
      )
    }

    projectKeys.set(loaded.project.projectKey, loaded.fileName)

    const sourceControlConnectionId = loaded.project.repository.sourceControlConnectionId

    if (sourceControlConnectionId && !sourceControlIds.has(sourceControlConnectionId)) {
      throw new NodeConfigurationError(
        `projects/${loaded.fileName}:repository/sourceControlConnectionId: ` +
          `Project references missing source-control connection ` +
          `"${sourceControlConnectionId}".`,
      )
    }
  }
}
