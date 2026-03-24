// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from "zod";

/**
 * Schema for the skill bundle.
 *
 * @example
 * ```toml
 * id = "text.summarize"
 * name = "Text Summarize"
 * version = "1.0.0"
 * description = "Summarizes a given text into a concise format."
 * executor = "text-summarize"
 * tags = ["text", "writing", "productivity"]
 *
 * [input]
 * schema = "json"
 *
 * [output]
 * schema = "text"
 *
 * [safety]
 * requires_confirmation = false
 * ```
 */
export const skillSchema = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string(),
    executor: z.string(),
    tags: z.array(z.string()),
    input: z.object({
        schema: z.string(),
    }),
    output: z.object({
        schema: z.string(),
    }),
    safety: z.object({
        requires_confirmation: z.boolean(),
    }),
});

/**
 * Type for the skill bundle.
 */
export type SkillBundle = z.infer<typeof skillSchema>;
