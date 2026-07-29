import { z } from 'zod';
/**
 * Validates runtime limits and failure-artifact retention settings for an
 * execution job.
 *
 * This strict protocol schema is shared by API and worker processes. Unknown
 * properties are rejected to prevent unsupported policy values from silently
 * crossing the wire. Omitted properties defer to runtime defaults.
 */
export declare const ExecutionJobPolicySchema: z.ZodObject<{
    maximumDurationSeconds: z.ZodOptional<z.ZodNumber>;
    preserveWorkspaceOnFailure: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
/**
 * Validated execution policy exchanged through the shared protocol.
 *
 * Derived from {@link ExecutionJobPolicySchema} so runtime validation and the
 * TypeScript representation remain aligned.
 */
export type ExecutionJobPolicy = z.infer<typeof ExecutionJobPolicySchema>;
//# sourceMappingURL=execution-job-policy.d.ts.map