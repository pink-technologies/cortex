"use strict";
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterNodeRequestSchema = void 0;
const zod_1 = require("zod");
const node_architecture_1 = require("./node-architecture");
const node_operating_system_1 = require("./node-operating-system");
/**
 * Reusable validator for non-empty protocol identifiers.
 *
 * Surrounding whitespace is removed before validation so whitespace-only
 * capabilities, labels, and job-kind values are rejected.
 */
const IdentifierSchema = zod_1.z
    .string()
    .trim()
    .min(1);
/**
 * Validates the metadata submitted when an execution node registers with the
 * Cortex API.
 *
 * The request describes the node's host platform, installation ownership, and
 * workload-matching abilities. Unknown properties are rejected to expose
 * protocol drift between nodes and the API.
 */
exports.RegisterNodeRequestSchema = zod_1.z
    .object({
    /** Normalized CPU architecture of the node host. */
    architecture: node_architecture_1.NodeArchitectureSchema,
    /**
     * Capability identifiers currently offered by the node.
     *
     * At least one capability is required for job-requirement matching.
     */
    capabilities: zod_1.z
        .array(IdentifierSchema)
        .min(1),
    /** Installation UUID under which the node is being registered. */
    installationId: zod_1.z
        .string()
        .uuid(),
    /**
     * Additional node attributes used for matching, such as region or pool.
     *
     * An empty array indicates that the node has no additional labels.
     */
    labels: zod_1.z
        .array(IdentifierSchema),
    /** Human-readable node name, limited to 128 characters. */
    name: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(128),
    /** Normalized operating system of the node host. */
    operatingSystem: node_operating_system_1.NodeOperatingSystemSchema,
    /**
     * Execution-job kinds the node knows how to process.
     *
     * At least one supported kind is required.
     */
    supportedKinds: zod_1.z
        .array(IdentifierSchema)
        .min(1),
    /** Optional node software version, limited to 64 characters. */
    version: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(64)
        .optional(),
})
    .strict();
//# sourceMappingURL=register-node-request.js.map