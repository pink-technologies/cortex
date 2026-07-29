"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterNodeResponseSchema = void 0;
const zod_1 = require("zod");
/**
 * Validates the API response returned after an execution node registers.
 *
 * The response assigns the node's stable server-side identity and tells it how
 * frequently to report liveness. Unknown properties are rejected to expose
 * protocol drift.
 */
exports.RegisterNodeResponseSchema = zod_1.z
    .object({
    /**
     * Required interval between node heartbeat requests, in whole seconds.
     */
    heartbeatIntervalSeconds: zod_1.z
        .number()
        .int()
        .positive(),
    /**
     * Stable UUID assigned to the registered node.
     *
     * The node uses this identifier in subsequent claim and heartbeat requests.
     */
    nodeId: zod_1.z
        .uuid(),
})
    .strict();
//# sourceMappingURL=register-node-response.js.map