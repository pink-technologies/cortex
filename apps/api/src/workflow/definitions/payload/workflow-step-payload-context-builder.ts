// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { WorkflowRun } from '../../models/workflow-run'
import type { WorkflowStep } from '../../models/workflow-step'
import type { WorkflowStepPayloadContext } from '../models'

/**
 * Fluent builder for {@link WorkflowStepPayloadContext}.
 *
 * Prefer a fresh instance per build:
 * `new WorkflowStepPayloadContextBuilder().withInput(input).build()`.
 * Do not retain a shared instance on a singleton provider — concurrent or
 * interleaved chains can leak inputs and outputs between runs.
 *
 * Callers set the run input with {@link withInput}, accumulate step outputs
 * with {@link addOutput} or {@link addOutputsThroughStep}, then call
 * {@link build} to produce a context for {@link resolveWorkflowStepPayload}.
 * State clears after {@link build} so reuse of the same instance starts clean
 * only when builds do not overlap.
 */
export class WorkflowStepPayloadContextBuilder {
  // MARK: - Properties

  private input: unknown
  private latestOutput: unknown
  private outputs: Record<string, unknown> = {}

  // MARK: - Instance methods

  /**
   * Sets the opaque run input carried on the context.
   *
   * @param input - Run input supplied at start.
   * @returns This builder for chaining.
   */
  withInput(input: unknown): this {
    this.input = input
    return this
  }

  /**
   * Records a non-null step output under its step key.
   *
   * `null` and `undefined` are ignored so missing outputs do not overwrite
   * earlier values or become `latestOutput`. When accepted, the value also
   * becomes {@link WorkflowStepPayloadContext.latestOutput}.
   *
   * @param key - Stable step key within the run.
   * @param output - Step output to record when non-null.
   * @returns This builder for chaining.
   */
  addOutput(key: string, output: unknown): this {
    if (output != null) {
      this.outputs[key] = output
      this.latestOutput = output
    }

    return this
  }

  /**
   * Accumulates outputs from the run's steps up through a completing step.
   *
   * Walks steps in position order. For {@link completingStep}, `output`
   * overrides any stored `candidate.output` so the context reflects the
   * just-finished result before persistence is reloaded. Steps after
   * {@link completingStep} are skipped.
   *
   * @param run - Run whose steps supply prior outputs.
   * @param completingStep - Step that just finished (or is finishing).
   * @param output - Output for {@link completingStep} at this activation.
   * @returns This builder for chaining.
   */
  addOutputsThroughStep(
    run: WorkflowRun,
    completingStep: WorkflowStep,
    output: unknown,
  ): this {
    const orderedSteps = [...run.steps].sort((left, right) => left.position - right.position)

    for (const candidate of orderedSteps) {
      if (candidate.position > completingStep.position) {
        continue
      }

      const candidateOutput = candidate.id === completingStep.id ? output : candidate.output
      this.addOutput(candidate.key, candidateOutput)
    }

    return this
  }

  /**
   * Builds a {@link WorkflowStepPayloadContext} from accumulated state.
   *
   * Clears this builder afterward so a later {@link withInput},
   * {@link addOutput}, or {@link addOutputsThroughStep} starts a new context
   * on the same instance.
   *
   * @returns Context ready for {@link resolveWorkflowStepPayload}.
   */
  build(): WorkflowStepPayloadContext {
    const context: WorkflowStepPayloadContext = {
      input: this.input,
      latestOutput: this.latestOutput,
      outputs: { ...this.outputs },
    }

    this.input = undefined
    this.latestOutput = undefined
    this.outputs = {}

    return context
  }
}
