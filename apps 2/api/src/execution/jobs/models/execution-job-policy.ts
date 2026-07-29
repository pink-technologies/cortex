// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Runtime policy for an execution job, persisted as `ExecutionJob.policy` JSON.
 *
 * Controls how long a run may take and whether worker artifacts are retained
 * after a failed attempt.
 */
export interface ExecutionJobPolicy {
    /**
     * Soft/hard upper bound on wall-clock time for a single attempt, in seconds.
     * Workers and the orchestrator use this to set deadlines and interrupt overdue work.
     */
    maximumDurationSeconds?: number

    /**
     * When `true`, keep the attempt workspace (files, temp state) after failure for
     * debugging or retry; when omitted or `false`, cleanup may discard it.
     */
    preserveWorkspaceOnFailure?: boolean
}