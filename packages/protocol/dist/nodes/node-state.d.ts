import { z } from 'zod';
/**
 * Validates lifecycle states for a registered Cortex execution node.
 *
 * - `ENABLED` — node may claim and execute work.
 * - `DISABLED` — node is temporarily prevented from claiming work.
 * - `REVOKED` — node credentials or registration have been permanently invalidated.
 */
export declare const NodeStateSchema: z.ZodEnum<{
    ENABLED: "ENABLED";
    DISABLED: "DISABLED";
    REVOKED: "REVOKED";
}>;
/**
 * Validated lifecycle state of a Cortex execution node.
 *
 * Derived from {@link NodeStateSchema} so runtime validation and the TypeScript
 * union remain synchronized.
 */
export type NodeState = z.infer<typeof NodeStateSchema>;
//# sourceMappingURL=node-state.d.ts.map