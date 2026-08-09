"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimExecutionJobResponseSchema = void 0;
const zod_1 = require("zod");
const execution_job_1 = require("./execution-job");
/**
 * Validates a successful execution-job claim response.
 *
 * The response wraps the claimed job in a stable top-level object so the
 * protocol can evolve without changing the job representation itself. The
 * schema is strict and rejects unknown response properties.
 */
exports.ClaimExecutionJobResponseSchema = zod_1.z
    .object({
    /**
     * Job assigned to the requesting node.
     *
     * The nested value must satisfy {@link ExecutionJobSchema}, including its
     * lifecycle status, policy, payload metadata, and ISO-8601 timestamps.
     */
    job: execution_job_1.ExecutionJobSchema.nullable(),
})
    .strict();
//# sourceMappingURL=claim-execution-job-response.js.map