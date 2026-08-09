// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowStepKind } from '../../datatypes'
import { WorkflowDefinitionInvalidError } from '../../error/error'
import type { WorkflowDefinition } from '../models'

/**
 * Validates a {@link WorkflowDefinition} before registration.
 *
 * Checks non-empty key/steps, unique step keys and positions, and that `JOB`
 * steps declare `jobKind` while `APPROVAL` steps declare neither `jobKind`
 * nor `buildPayload`.
 *
 * @param definition - Definition to validate.
 * @throws {@link WorkflowDefinitionInvalidError} when the definition is malformed.
 */
export function validateWorkflowDefinition(definition: WorkflowDefinition): void {
  if (definition.key.trim().length === 0) {
    throw new WorkflowDefinitionInvalidError(definition.key, 'Workflow definition key must not be empty')
  }

  if (!Number.isInteger(definition.version) || definition.version < 1) {
    throw new WorkflowDefinitionInvalidError(
      definition.key,
      `Workflow definition ${definition.key} version must be a positive integer`,
    )
  }

  if (definition.steps.length === 0) {
    throw new WorkflowDefinitionInvalidError(
      definition.key,
      `Workflow definition ${definition.key} must declare at least one step`,
    )
  }

  const keys = new Set<string>()
  const positions = new Set<number>()

  for (const step of definition.steps) {
    if (step.key.trim().length === 0) {
      throw new WorkflowDefinitionInvalidError(
        definition.key,
        `Workflow definition ${definition.key} has a step with an empty key`,
      )
    }

    if (keys.has(step.key)) {
      throw new WorkflowDefinitionInvalidError(
        definition.key,
        `Workflow definition ${definition.key} has duplicate step key ${step.key}`,
      )
    }

    if (positions.has(step.position)) {
      throw new WorkflowDefinitionInvalidError(
        definition.key,
        `Workflow definition ${definition.key} has duplicate step position ${step.position}`,
      )
    }

    if (step.kind === WorkflowStepKind.JOB && (step.jobKind == null || step.jobKind.trim().length === 0)) {
      throw new WorkflowDefinitionInvalidError(
        definition.key,
        `Workflow definition ${definition.key} step ${step.key} is JOB but missing jobKind`,
      )
    }

    if (step.kind === WorkflowStepKind.APPROVAL && step.jobKind != null) {
      throw new WorkflowDefinitionInvalidError(
        definition.key,
        `Workflow definition ${definition.key} step ${step.key} is APPROVAL but sets jobKind`,
      )
    }

    if (step.kind === WorkflowStepKind.APPROVAL && step.buildPayload != null) {
      throw new WorkflowDefinitionInvalidError(
        definition.key,
        `Workflow definition ${definition.key} step ${step.key} is APPROVAL but sets buildPayload`,
      )
    }

    keys.add(step.key)
    positions.add(step.position)
  }
}
