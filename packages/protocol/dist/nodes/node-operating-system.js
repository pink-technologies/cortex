"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeOperatingSystemSchema = exports.NodeOperatingSystem = void 0;
const zod_1 = require("zod");
/**
 * Canonical operating-system identifiers used by the Cortex node protocol.
 *
 * Use these constants when constructing registration payloads or comparing
 * validated operating-system values:
 *
 * - `LINUX` — Linux-based hosts.
 * - `MACOS` — Apple macOS hosts.
 * - `WINDOWS` — Microsoft Windows hosts.
 */
exports.NodeOperatingSystem = {
    LINUX: 'LINUX',
    MACOS: 'MACOS',
    WINDOWS: 'WINDOWS',
};
/**
 * Validates operating systems supported by Cortex execution nodes.
 *
 * The normalized protocol values are independent of runtime-specific names
 * such as Node.js `process.platform`.
 *
 * - `LINUX` — Linux-based hosts.
 * - `MACOS` — Apple macOS hosts.
 * - `WINDOWS` — Microsoft Windows hosts.
 */
exports.NodeOperatingSystemSchema = zod_1.z.enum([
    exports.NodeOperatingSystem.LINUX,
    exports.NodeOperatingSystem.MACOS,
    exports.NodeOperatingSystem.WINDOWS,
]);
//# sourceMappingURL=node-operating-system.js.map