import { z } from 'zod';
/**
 * Validates the metadata submitted when an execution node registers with the
 * Cortex API.
 *
 * The request describes the node's host platform, installation ownership, and
 * workload-matching abilities. Unknown properties are rejected to expose
 * protocol drift between nodes and the API.
 */
export declare const RegisterNodeRequestSchema: z.ZodObject<{
    architecture: z.ZodEnum<{
        ARM64: "ARM64";
        X64: "X64";
    }>;
    capabilities: z.ZodArray<z.ZodString>;
    installationId: z.ZodString;
    labels: z.ZodArray<z.ZodString>;
    name: z.ZodString;
    operatingSystem: z.ZodEnum<{
        LINUX: "LINUX";
        MACOS: "MACOS";
        WINDOWS: "WINDOWS";
    }>;
    supportedKinds: z.ZodArray<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
/**
 * Validated execution-node registration request.
 *
 * Derived from {@link RegisterNodeRequestSchema} so runtime validation and the
 * TypeScript representation remain synchronized.
 */
export type RegisterNodeRequest = z.infer<typeof RegisterNodeRequestSchema>;
//# sourceMappingURL=register-node-request.d.ts.map