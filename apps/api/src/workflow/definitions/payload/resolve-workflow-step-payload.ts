// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowDefinitionStep, WorkflowStepPayloadContext } from '../models'

/**
 * Resolves the child job payload for a `JOB` step activation.
 *
 * Delegates to the step's `buildPayload` when the definition declares one;
 * otherwise applies the default mapping — the most recent completed step
 * output, falling back to the run input. Both the start and advance flows
 * resolve payloads through this function so first-step and later-step
 * activations cannot drift apart.
 *
 * @param step - Definition step being activated.
 * @param context - Run input and prior step outputs at activation time.
 * @returns The payload for the enqueued child execution job.
 * @throws Whatever the step's `buildPayload` throws (for example a failed
 *   schema parse); callers wrap it in their flow's semantic error.
 */
export function resolveWorkflowStepPayload(
  step: WorkflowDefinitionStep,
  context: WorkflowStepPayloadContext,
): unknown {
  if (step.buildPayload) {
    return step.buildPayload(context)
  }

  return context.latestOutput ?? context.input
}
