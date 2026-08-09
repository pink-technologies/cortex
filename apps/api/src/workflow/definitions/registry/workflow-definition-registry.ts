// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import type { WorkflowDefinition } from '../models'
import { validateWorkflowDefinition } from './validate-workflow-definition'
import { WorkflowDefinitionAlreadyRegisteredError, WorkflowDefinitionNotFoundError } from '../../error/error'

/**
 * In-memory catalog of {@link WorkflowDefinition} records.
 *
 * Hosts register flows at startup (built-ins today; plugins later).
 * Orchestration resolves a definition by key (latest) or key+version
 * (pinned) before creating or advancing a {@link WorkflowRun}.
 *
 * Responsibilities:
 * - store definitions keyed by {@link WorkflowDefinition.key} and
 *   {@link WorkflowDefinition.version}
 * - reject duplicate key+version registration
 * - resolve the latest version for a key, or an exact pinned version
 *
 * Non-responsibilities:
 * - choosing which flows to register
 * - loading plugin packages
 * - creating runs or execution jobs
 */
@Injectable()
export class WorkflowDefinitionRegistry {
  // MARK: - Properties

  private readonly definitions = new Map<string, Map<number, WorkflowDefinition>>()

  // MARK: - Instance methods

  /**
   * Returns whether a definition is registered for the given key.
   *
   * When {@link version} is omitted, returns whether any revision exists.
   * Prefer this for optional lookups. Use {@link resolve} when a missing
   * definition is an error for the caller.
   *
   * @param key - Stable definition key (for example `jira.triage.flow`).
   * @param version - Optional exact revision to look up.
   * @returns `true` when a matching definition is registered; otherwise `false`.
   */
  has(key: string, version?: number): boolean {
    const versions = this.definitions.get(key)

    if (!versions) {
      return false
    }

    if (version === undefined) {
      return versions.size > 0
    }

    return versions.has(version)
  }

  /**
   * Registers a workflow definition under its key and version.
   *
   * Validates step shape, stores a copy with steps ordered by `position`
   * ascending, then inserts. Registration is append-only per key+version;
   * a new revision of an existing key must use a new {@link WorkflowDefinition.version}.
   *
   * @param definition - Flow definition to store.
   * @throws {@link WorkflowDefinitionInvalidError} when the definition is malformed.
   * @throws {@link WorkflowDefinitionAlreadyRegisteredError} when the key+version exists.
   */
  register(definition: WorkflowDefinition): void {
    validateWorkflowDefinition(definition)

    const versions = this.definitions.get(definition.key) ?? new Map<number, WorkflowDefinition>()

    if (versions.has(definition.version)) {
      throw new WorkflowDefinitionAlreadyRegisteredError(definition.key, definition.version)
    }

    versions.set(definition.version, {
      key: definition.key,
      steps: [...definition.steps].sort((left, right) => left.position - right.position),
      version: definition.version,
    })
    this.definitions.set(definition.key, versions)
  }

  /**
   * Returns a registered definition for the given key.
   *
   * When {@link version} is omitted, returns the highest registered revision
   * (used at start). When provided, returns that exact revision (used when
   * advancing a pinned run).
   *
   * @param key - Stable definition key (for example `jira.triage.flow`).
   * @param version - Optional exact revision pinned on a run.
   * @returns The registered {@link WorkflowDefinition}.
   * @throws {@link WorkflowDefinitionNotFoundError} when no matching definition is registered.
   */
  resolve(key: string, version?: number): WorkflowDefinition {
    const versions = this.definitions.get(key)

    if (!versions || versions.size === 0) {
      throw new WorkflowDefinitionNotFoundError(key, version)
    }

    if (version !== undefined) {
      const definition = versions.get(version)

      if (!definition) {
        throw new WorkflowDefinitionNotFoundError(key, version)
      }

      return definition
    }

    const latestVersion = Math.max(...versions.keys())
    return versions.get(latestVersion)!
  }
}
