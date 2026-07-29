import { z } from 'zod';
/**
 * Validates the API response returned after an execution node registers.
 *
 * The response assigns the node's stable server-side identity and tells it how
 * frequently to report liveness. Unknown properties are rejected to expose
 * protocol drift.
 */
export declare const RegisterNodeResponseSchema: z.ZodObject<{
    heartbeatIntervalSeconds: z.ZodNumber;
    nodeId: z.ZodUUID;
}, z.core.$strict>;
/**
 * Validated response from a successful execution-node registration.
 *
 * Derived from {@link RegisterNodeResponseSchema} so runtime validation and the
 * TypeScript representation remain synchronized.
 */
export type RegisterNodeResponse = z.infer<typeof RegisterNodeResponseSchema>;
//# sourceMappingURL=register-node-response.d.ts.map