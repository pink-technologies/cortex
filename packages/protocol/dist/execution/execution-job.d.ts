import { z } from 'zod';
/**
 * Validates the wire-level representation of an execution job.
 *
 * This strict schema defines the shared contract exchanged between API and
 * worker processes. It contains only transport-safe fields, represents dates
 * as ISO-8601 strings, and rejects unknown properties to surface protocol
 * drift immediately.
 */
export declare const ExecutionJobSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodISODateTime;
    kind: z.ZodString;
    payload: z.ZodUnknown;
    payloadVersion: z.ZodNumber;
    priority: z.ZodNumber;
    policy: z.ZodObject<{
        maximumDurationSeconds: z.ZodOptional<z.ZodNumber>;
        preserveWorkspaceOnFailure: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>;
    claimToken: z.ZodNullable<z.ZodUUID>;
    status: z.ZodEnum<{
        AWAITING_REVIEW: "AWAITING_REVIEW";
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
        FAILED: "FAILED";
        INTERRUPTED: "INTERRUPTED";
        QUEUED: "QUEUED";
        RUNNING: "RUNNING";
    }>;
    updatedAt: z.ZodISODateTime;
}, z.core.$strict>;
/**
 * Validated execution job exchanged through the shared protocol.
 *
 * Derived from {@link ExecutionJobSchema} so its compile-time representation
 * remains synchronized with runtime validation.
 */
export type ExecutionJob = z.infer<typeof ExecutionJobSchema>;
//# sourceMappingURL=execution-job.d.ts.map