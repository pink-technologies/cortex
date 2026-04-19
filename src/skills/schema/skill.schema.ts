// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from "zod";

/**
 * Schema for the skill schema.
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
 * Type for the skill schema.
 */
type SkillSchemaDto = z.infer<typeof skillSchema>;

/**
 * Class for the skill definition.
 */
export class SkillSchema {
    // MARK: - Constructor

    /**
     * Creates a new instance of {@link CapabilitySchema}.
     *
     * @param schema - The agent schema.
     */
    private constructor(readonly schema: SkillSchemaDto) { }

    // MARK: - Static methods

    /**
     * Wraps an already-validated {@link SkillSchemaDto} (e.g. `skillSchema.parse` on raw TOML).
     *
     * @param input - Validated skill definition.
     * @returns A new instance of {@link SkillSchema}.
     */
    static from(input: SkillSchemaDto): SkillSchema {
        return new SkillSchema(input);
    }
}