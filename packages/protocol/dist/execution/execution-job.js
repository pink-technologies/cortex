"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionJobSchema = void 0;
const zod_1 = require("zod");
const execution_job_policy_1 = require("./execution-job-policy");
const execution_job_status_1 = require("./execution-job-status");
/**
 * Validates the wire-level representation of an execution job.
 *
 * This strict schema defines the shared contract exchanged between API and
 * worker processes. It contains only transport-safe fields, represents dates
 * as ISO-8601 strings, and rejects unknown properties to surface protocol
 * drift immediately.
 */
exports.ExecutionJobSchema = zod_1.z.object({
    /** Stable, non-empty identifier of the execution job. */
    id: zod_1.z.string().min(1),
    /** ISO-8601 timestamp at which the job was persisted. */
    createdAt: zod_1.z.iso.datetime(),
    /**
     * Non-empty discriminator used to route the job to its execution handler.
     *
     * Examples include `"skill.run"` and `"agent.decide"`.
     */
    kind: zod_1.z.string().trim().min(1),
    /** Opaque, handler-specific input supplied when the job executes. */
    payload: zod_1.z.unknown(),
    /** Positive schema version used to interpret and validate {@link payload}. */
    payloadVersion: zod_1.z.number().int().positive(),
    /** Integer queue weight; higher values are preferred when claiming jobs. */
    priority: zod_1.z.number().int(),
    /** Runtime limits and failure-artifact retention settings. */
    policy: execution_job_policy_1.ExecutionJobPolicySchema,
    /** Current lifecycle state of the execution job. */
    status: execution_job_status_1.ExecutionJobStatusSchema,
    /** ISO-8601 timestamp of the most recent persisted change. */
    updatedAt: zod_1.z.iso.datetime(),
}).strict();
//# sourceMappingURL=execution-job.js.map