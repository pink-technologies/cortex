// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common'
import type { WorkflowDefinition } from '../models'
import { validateWorkflowDefinition } from './validate-workflow-definition'
import {
  WorkflowDefinitionAlreadyRegisteredError,
  WorkflowDefinitionNotFoundError,
} from '../../error/error'

/**
 * In-memory catalog of {@link WorkflowDefinition} records.
 *
 * Hosts register flows at startup (built-ins today; plugins later).
 * Orchestration resolves a definition by key before creating a
 * {@link WorkflowRun}.
 *
 * Responsibilities:
 * - store definitions keyed by {@link WorkflowDefinition.key}
 * - reject duplicate registration
 * - resolve definitions by key
 *
 * Non-responsibilities:
 * - choosing which flows to register
 * - loading plugin packages
 * - creating runs or execution jobs
 */
@Injectable()
export class WorkflowDefinitionRegistry {
  // MARK: - Properties

  private readonly definitions = new Map<string, WorkflowDefinition>()

  // MARK: - Instance methods

  /**
   * Returns whether a definition is registered for the given key.
   *
   * Prefer this for optional lookups. Use {@link resolve} when a missing
   * definition is an error for the caller.
   *
   * @param key - Stable definition key (for example `jira.triage.flow`).
   * @returns `true` when a definition is registered for `key`; otherwise `false`.
   */
  has(key: string): boolean {
    return this.definitions.has(key)
  }

  /**
   * Registers a workflow definition under its {@link WorkflowDefinition.key}.
   *
   * Validates step shape, stores a copy with steps ordered by `position`
   * ascending, then inserts. Registration is append-only.
   *
   * @param definition - Flow definition to store.
   * @throws {@link WorkflowDefinitionInvalidError} when the definition is malformed.
   * @throws {@link WorkflowDefinitionAlreadyRegisteredError} when the key exists.
   */
  register(definition: WorkflowDefinition): void {
    validateWorkflowDefinition(definition)

    if (this.definitions.has(definition.key)) {
      throw new WorkflowDefinitionAlreadyRegisteredError(definition.key)
    }

    this.definitions.set(definition.key, {
      key: definition.key,
      steps: [...definition.steps].sort((left, right) => left.position - right.position),
    })
  }

  /**
   * Returns the registered definition for the given key.
   *
   * @param key - Stable definition key (for example `jira.triage.flow`).
   * @returns The registered {@link WorkflowDefinition}.
   * @throws {@link WorkflowDefinitionNotFoundError} when no definition is registered.
   */
  resolve(key: string): WorkflowDefinition {
    const definition = this.definitions.get(key)

    if (!definition) {
      throw new WorkflowDefinitionNotFoundError(key)
    }

    return definition
  }
}
