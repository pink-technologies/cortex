// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from "zod";

/**
 * Schema for the config option.
 */
export const configOptionSchema = z.object({
    value: z.string(),
    label: z.string(),
});

/**
 * Schema for the config.
 */
export const configSchema = z.object({
    key: z.string(),
    label: z.string(),
    description: z.string(),
    type: z.enum(["multiselect", "select", "text"]),
    required: z.boolean(),
    source: z.string().optional(),
    default: z.string().optional(),
    options: z.array(configOptionSchema).optional(),
});

/**
 * Type for the config option.
 */
export type ConfigOption = z.infer<typeof configOptionSchema>;

/**
 * Type for the config.
 */
export type Config = z.infer<typeof configSchema>;