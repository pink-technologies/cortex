"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeArchitectureSchema = exports.NodeArchitecture = void 0;
const zod_1 = require("zod");
/**
 * Canonical CPU architecture identifiers used by the Cortex node protocol.
 *
 * Use these constants when constructing registration payloads or comparing
 * validated architecture values:
 *
 * - `ARM64` — 64-bit ARM architecture, including Apple Silicon.
 * - `X64` — 64-bit x86 architecture.
 */
exports.NodeArchitecture = {
    ARM64: 'ARM64',
    X64: 'X64',
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
exports.NodeArchitectureSchema = zod_1.z.enum([
    exports.NodeArchitecture.ARM64,
    exports.NodeArchitecture.X64,
]);
//# sourceMappingURL=node-architecture.js.map