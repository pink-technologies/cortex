"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionJobStatusSchema = void 0;
const zod_1 = require("zod");
/**
 * Wire-level lifecycle states accepted for an execution job.
 *
 * This protocol schema is the shared validation boundary between API and
 * worker processes. Keep its values aligned with the execution-job status
 * values used by persistence and domain layers.
 *
 * - `QUEUED` — accepted and waiting for an eligible worker.
 * - `RUNNING` — currently being processed by a worker.
 * - `AWAITING_REVIEW` — paused pending human or external approval.
 * - `COMPLETED` — finished successfully.
 * - `FAILED` — terminated unsuccessfully with no further automatic attempt.
 * - `CANCELLED` — stopped by an explicit cancellation request.
 * - `INTERRUPTED` — stopped unexpectedly and may be eligible for recovery.
 */
exports.ExecutionJobStatusSchema = zod_1.z.enum([
    'AWAITING_REVIEW',
    'CANCELLED',
    'COMPLETED',
    'FAILED',
    'INTERRUPTED',
    'QUEUED',
    'RUNNING',
]);
//# sourceMappingURL=execution-job-status.js.map