// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Input for a node claiming the next ready {@link ExecutionJob} from the queue.
 *
 * The claimer matches queued jobs whose `requirements` and `kind` fit this node,
 * then creates a running {@link ExecutionJobAttempt} owned by {@link nodeId} with
 * a lease of {@link leaseDurationSeconds}.
 */
export interface ClaimExecutionJobParameters {
    /**
     * Capability ids this node currently offers.
     *
     * Matched against job {@link ExecutionJobRequirements} (`allOf` / `anyOf` / `noneOf`).
     */
    capabilities: string[]

    /**
     * Labels attached to this node (region, pool, hardware tier, etc.).
     *
     * Matched against optional job `requirements.labels` when present.
     */
    labels: string[]

    /**
     * How long the attempt lease lasts after a successful claim, in seconds.
     *
     * Maps to `ExecutionJobAttempt.leaseExpiresAt` (and renewals update
     * `lastLeaseRenewalAt`). Expired leases allow another node to reclaim the job.
     */
    leaseDurationSeconds: number

    /**
     * Job `kind` values this node can execute (for example `"skill.run"`).
     *
     * Only queued jobs whose `kind` is in this list are eligible to claim.
     */
    supportedKinds: string[]

    /**
     * Claiming node’s primary key (`ExecutionWorker.id`).
     *
     * Stored on the new attempt as `nodeId` and used for lease ownership.
     */
    nodeId: string
}
