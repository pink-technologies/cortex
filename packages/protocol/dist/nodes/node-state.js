"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeStateSchema = void 0;
const zod_1 = require("zod");
/**
 * Validates lifecycle states for a registered Cortex execution node.
 *
 * - `ENABLED` — node may claim and execute work.
 * - `DISABLED` — node is temporarily prevented from claiming work.
 * - `REVOKED` — node credentials or registration have been permanently invalidated.
 */
exports.NodeStateSchema = zod_1.z.enum([
    'ENABLED',
    'DISABLED',
    'REVOKED',
]);
//# sourceMappingURL=node-state.js.map