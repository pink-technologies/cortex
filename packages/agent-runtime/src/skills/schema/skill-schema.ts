// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { identifierSchema } from '@/manifest/schema/identifier-schema'
import { validateUniqueValues } from '@/manifest'

/**
 * Validates a skill package manifest (for example `skill.toml` under
 * `.agents/skills/<skill-id>/`).
 *
 * A skill is a prompt package: metadata in this manifest plus body text loaded
 * from {@link prompt_file}. Authorization (which skills an agent may use) and
 * selection (which prompts are injected for a run) are separate—see
 * {@link SkillDefinition} and {@link SkillSelector}.
 *
 * Wire keys are snake_case. After loading, {@link SkillDefinitionLoader} maps
 * this shape onto {@link SkillDefinition}, resolving {@link prompt_file} into
 * {@link SkillDefinition.prompt}. Unknown top-level keys are rejected
 * (`.strict()`). Keyword entries must be unique within the `keywords` list.
 *
 * This schema describes static package configuration only—not runtime injection
 * state or an executable agent.
 */
export const skillSchema = z
  .object({
    /**
     * Stable skill identifier agents and selectors reference.
     *
     * Must match {@link identifierSchema} (for example `code-review-diff`).
     */
    id: identifierSchema,

    /**
     * Human-readable explanation of what the skill provides.
     *
     * Must be non-empty after trim. Used in catalogs and by
     * {@link SkillSelector} relevance ranking.
     */
    description: z.string().trim().min(1),

    /**
     * Optional relevance tokens for selective prompt injection.
     *
     * Defaults to `[]`. Each entry must be non-empty after trim. Duplicates
     * within the list are rejected. When empty after load, the runtime omits
     * {@link SkillDefinition.keywords}.
     */
    keywords: z.array(z.string().trim().min(1)).default([]),

    /**
     * Path to the skill prompt body, relative to the manifest directory.
     *
     * Must be non-empty after trim (for example `prompt.md`). The loader reads
     * this file and stores the trimmed contents as {@link SkillDefinition.prompt}.
     */
    prompt_file: z.string().trim().min(1),
  })
  .strict()
  .superRefine((value, context) => {
    validateUniqueValues(value.keywords, 'keywords', context)
  })

/**
 * Parsed skill package configuration produced by {@link skillSchema}.
 *
 * Wire/manifest shape before the loader resolves {@link SkillManifest.prompt_file}
 * into {@link SkillDefinition.prompt}.
 */
export type SkillManifest = z.infer<typeof skillSchema>
