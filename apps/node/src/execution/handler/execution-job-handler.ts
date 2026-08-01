// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ExecutionJobHandlerContext } from './models'

/**
 * Kind-specific executor for a claimed Cortex execution job.
 *
 * Implementations are registered by {@link kind} and invoked when the Node
 * claims a job of that kind. Each handler owns payload interpretation and
 * producing the kind's result; routing and lifecycle HTTP calls remain outside
 * this interface.
 *
 * @typeParam TResult - Outcome returned on success; use `void` / `undefined`
 *   for kinds that only need a lifecycle transition.
 */
export interface ExecutionJobHandler<TResult = unknown> {
  /**
   * Non-empty job-kind discriminator this handler supports.
   *
   * Must match the protocol `kind` on claimed jobs (for example
   * `"agent.execute"` or `"system.test"`). The registry keys handlers by this
   * value and rejects unknown kinds.
   */
  readonly kind: string

  /**
   * Executes the job for this handler's kind.
   *
   * Payloads arrive as `unknown` because jobs cross the wire as opaque JSON;
   * each handler validates the shape it supports before executing.
   *
   * @param payload - Kind-specific input from the claimed job.
   * @param context - Execution identity and cancellation controls.
   * @returns The kind-specific result to report on successful completion.
   * @throws When execution fails; callers map the error into a protocol
   *   failure and mark the job failed.
   */
  process(payload: unknown, context: ExecutionJobHandlerContext): Promise<TResult>
}
