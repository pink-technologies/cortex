// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowRun } from '../models'
import { WorkflowRunResponseSchema, type WorkflowRunResponse } from '@cortex/protocol'

/**
 * Maps a domain {@link WorkflowRun} into the public workflow-run response.
 *
 * Converts dates to ISO-8601, projects the read-model fields (step payloads
 * are omitted), and validates the result against
 * {@link WorkflowRunResponseSchema}.
 */
export class WorkflowRunResponseMapper {
  // MARK: - Static methods

  /**
   * Creates a protocol response from a domain workflow run.
   *
   * @param run - Domain workflow run to expose.
   * @returns Validated workflow-run read response.
   */
  static from(run: WorkflowRun): WorkflowRunResponse {
    return WorkflowRunResponseSchema.parse({
      id: run.id,
      completedAt: run.completedAt?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
      definitionKey: run.definitionKey,
      definitionVersion: run.definitionVersion,
      failedAt: run.failedAt?.toISOString() ?? null,
      failure: run.failure,
      result: run.result,
      startedAt: run.startedAt?.toISOString() ?? null,
      status: run.status,
      steps: run.steps.map((step) => ({
        id: step.id,
        completedAt: step.completedAt?.toISOString() ?? null,
        failedAt: step.failedAt?.toISOString() ?? null,
        jobKind: step.jobKind,
        key: step.key,
        kind: step.kind,
        position: step.position,
        startedAt: step.startedAt?.toISOString() ?? null,
        status: step.status,
      })),
    })
  }
}
