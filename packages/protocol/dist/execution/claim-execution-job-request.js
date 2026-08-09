"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimExecutionJobRequestSchema = void 0;
const zod_1 = require("zod");
/**
 * Validates the worker-matching criteria used to claim an execution job.
 *
 * The claim service uses this strict wire contract to select a queued job whose
 * kind and requirements are compatible with the requesting worker. Unknown
 * properties are rejected to expose protocol drift between clients and the
 * service.
 */
exports.ClaimExecutionJobRequestSchema = zod_1.z.object({
    /**
     * Stable identifier of the node requesting the claim.
     *
     * Used as the lease owner for the resulting execution attempt.
     */
    nodeId: zod_1.z.uuid(),
}).strict();
//# sourceMappingURL=claim-execution-job-request.js.map