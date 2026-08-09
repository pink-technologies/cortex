import { z } from 'zod';
/**
 * Canonical CPU architecture identifiers used by the Cortex node protocol.
 *
 * Use these constants when constructing registration payloads or comparing
 * validated architecture values:
 *
 * - `ARM64` — 64-bit ARM architecture, including Apple Silicon.
 * - `X64` — 64-bit x86 architecture.
 */
export declare const NodeArchitecture: {
    readonly ARM64: "ARM64";
    readonly X64: "X64";
};
/**
 * Validates CPU architectures supported by Cortex execution nodes.
 *
 * - `ARM64` — 64-bit ARM architecture, including Apple Silicon.
 * - `X64` — 64-bit x86 architecture.
 *
 * These wire-level values are platform-neutral and should be mapped from the
 * host runtime's architecture identifier during node registration.
 */
export declare const NodeArchitectureSchema: z.ZodEnum<{
    ARM64: "ARM64";
    X64: "X64";
}>;
/**
 * Validated CPU architecture advertised by a Cortex node.
 *
 * Derived from {@link NodeArchitectureSchema} so runtime validation and the
 * TypeScript union remain synchronized.
 */
export type NodeArchitecture = z.infer<typeof NodeArchitectureSchema>;
//# sourceMappingURL=node-architecture.d.ts.map