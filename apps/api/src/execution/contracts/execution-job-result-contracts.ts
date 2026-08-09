// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ZodType } from 'zod'
import { ExecutionJobResultInvalidError } from '../error/error'
import {
  AgentExecuteJobKind,
  AgentExecuteJobResultSchema,
  JiraTriageJobKind,
  JiraTriageJobResultSchema,
  RepositoryReviewJobKind,
  RepositoryReviewJobResultSchema,
} from '@cortex/protocol'

/**
 * Contract result schemas registered per execution-job kind.
 *
 * The shared protocol treats job results as opaque; this map is where the API
 * composes the kind-specific contracts it enforces at the completion boundary.
 * Kinds without an entry produce no validated protocol result and their
 * reported values pass through unchanged.
 */
const EXECUTION_JOB_RESULT_SCHEMAS: ReadonlyMap<string, ZodType> = new Map<string, ZodType>([
  [AgentExecuteJobKind, AgentExecuteJobResultSchema],
  [JiraTriageJobKind, JiraTriageJobResultSchema],
  [RepositoryReviewJobKind, RepositoryReviewJobResultSchema],
])

/**
 * Returns whether `kind` has a registered result contract that must be present
 * on successful completion.
 *
 * @param kind - Discriminator of the execution job.
 */
export function hasExecutionJobResultContract(kind: string): boolean {
  return EXECUTION_JOB_RESULT_SCHEMAS.has(kind)
}

/**
 * Validates a reported execution-job result against its kind's contract.
 *
 * Looks up the contract schema registered for `kind` and parses `result`
 * against it. Kinds with no registered contract are returned unchanged, since
 * the shared protocol does not interpret their results.
 *
 * @param kind - Discriminator of the execution job the result belongs to.
 * @param result - Opaque result reported by the completing Node.
 * @returns The parsed result for contract-bearing kinds; otherwise `result`.
 * @throws {ExecutionJobResultInvalidError} When the result violates the
 *   contract schema registered for the kind, or when a contract-bearing kind
 *   completes without a result.
 */
export function validateExecutionJobResult(kind: string, result: unknown): unknown {
  const schema = EXECUTION_JOB_RESULT_SCHEMAS.get(kind)

  if (!schema) {
    return result
  }

  if (result === undefined) {
    throw new ExecutionJobResultInvalidError(
      `Execution job kind "${kind}" requires a result on successful completion`,
    )
  }

  const parsed = schema.safeParse(result)

  if (!parsed.success) {
    throw new ExecutionJobResultInvalidError(`Execution job result violates the "${kind}" contract`, {
      cause: parsed.error,
    })
  }

  return parsed.data
}
