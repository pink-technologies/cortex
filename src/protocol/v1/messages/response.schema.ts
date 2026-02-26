// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import z from "zod";
import { PROTOCOL_VERSION } from "../protocol-version";

/**
 * Canonical protocol error shape used in failed responses.
 */
export const ErrorSchema = z.object({
    /**
     * Stable machine-readable code for programmatic handling.
     * Example: "run_not_found", "auth_invalid_token".
     */
    code: z.string().min(1).describe("Machine-readable error code"),
    
    /**
     * Optional extra context for debugging/logging.
     * Not guaranteed to be stable across versions.
     */
    details: z.unknown().optional().describe("Optional diagnostic payload"),
    
    /**
     * Human-readable message suitable for UI/logs.
     */
    message: z.string().min(1).describe("Human-readable error message"),
});

/**
 * Base response envelope: common fields for all protocol responses.
 * Use ResponseOKSchema or ResponseErrorSchema for success vs failure variants.
 */
const ResponseSchema = z.object({
    /**
     * Correlation id matching the originating command/request id.
     */
    id: z.string().min(1).describe("Correlation ID"),

    /**
     * Discriminator for message type; always 'response'.
     */
    type: z.literal("response").describe("Response type"),

    /**
     * Protocol version this response conforms to.
     */
    version: z.literal(PROTOCOL_VERSION).describe("Protocol version"),
}).strict();

/**
 * Response shape when the command failed. Use when `ok` is false; `error` is present.
 */
export const ResponseErrorSchema = ResponseSchema.extend({
    /**
     * False when command failed.
     */
    ok: z.literal(false).describe("Success flag"),

    /**
     * Canonical error when operation fails.
     */
    error: ErrorSchema.describe("Error details"),
});

/**
 * Response shape when the command succeeded. Use when `ok` is true; `payload` holds the result.
 */
export const ResponseOKSchema = ResponseSchema.extend({
    /**
     * True when command completed successfully.
     */
    ok: z.literal(true).describe("Success flag"),

    /**
     * Command result payload (method-specific shape).
     */
    payload: z.unknown().describe("Response payload"),
});