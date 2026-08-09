import { z } from 'zod';
/**
 * Validates a successful execution-job claim response.
 *
 * The response wraps the claimed job in a stable top-level object so the
 * protocol can evolve without changing the job representation itself. The
 * schema is strict and rejects unknown response properties.
 */
export declare const ClaimExecutionJobResponseSchema: z.ZodObject<{
    job: z.ZodNullable<z.ZodObject<{
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
    }, z.core.$strict>>;
}, z.core.$strict>;
/**
 * Validated successful claim response exchanged through the shared protocol.
 *
 * Derived from {@link ClaimExecutionJobResponseSchema} so runtime validation
 * and the TypeScript representation remain synchronized.
 */
export type ClaimExecutionJobResponse = z.infer<typeof ClaimExecutionJobResponseSchema>;
//# sourceMappingURL=claim-execution-job-response.d.ts.map