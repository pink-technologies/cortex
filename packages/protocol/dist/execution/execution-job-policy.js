"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionJobPolicySchema = void 0;
const zod_1 = require("zod");
/**
 * Validates runtime limits and failure-artifact retention settings for an
 * execution job.
 *
 * This strict protocol schema is shared by API and worker processes. Unknown
 * properties are rejected to prevent unsupported policy values from silently
 * crossing the wire. Omitted properties defer to runtime defaults.
 */
exports.ExecutionJobPolicySchema = zod_1.z.object({
    /**
     * Maximum wall-clock duration allowed for one execution attempt, in seconds.
     *
     * Must be a positive integer when supplied. Workers may use it to establish
     * a deadline and interrupt overdue work.
     */
    maximumDurationSeconds: zod_1.z
        .number()
        .int()
        .positive()
        .optional(),
    /**
     * Whether files and temporary state should be retained after a failed attempt.
     *
     * Retention supports debugging and retries. When omitted or `false`, the
     * runtime may discard the workspace during cleanup.
     */
    preserveWorkspaceOnFailure: zod_1.z
        .boolean()
        .optional(),
}).strict();
//# sourceMappingURL=execution-job-policy.js.map