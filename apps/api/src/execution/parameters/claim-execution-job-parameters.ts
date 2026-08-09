// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Input for claiming the next ready {@link ExecutionJob} from the queue.
 *
 * Built by the claim service from the registered node's persisted metadata after
 * the caller supplies a valid `nodeId`.
 */
export interface ClaimExecutionJobParameters {
  /**
   * Capability ids this node currently offers.
   *
   * Matched against job requirements (`allOf` / `anyOf` / `noneOf`).
   */
  capabilities: string[]

  /**
   * Labels attached to this node for optional requirement matching.
   */
  labels: string[]

  /**
   * Claiming node's primary key.
   *
   * Used as the lease owner for the resulting execution attempt.
   */
  nodeId: string

  /**
   * Job `kind` values this node can execute.
   *
   * Only queued jobs whose `kind` is in this list are eligible to claim.
   */
  supportedKinds: string[]
}
