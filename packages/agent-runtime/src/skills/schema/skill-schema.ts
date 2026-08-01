// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { identifierSchema } from '@/manifest/schema/identifier-schema'
import { validateUniqueValues } from '@/manifest'

/**
 * Validates a skill manifest (for example `skill.toml`).
 *
 * Wire keys are snake_case. After loading, the runtime maps this shape onto
 * {@link SkillDefinition} and resolves {@link prompt_file} into
 * {@link SkillDefinition.prompt}.
 */
export const skillSchema = z
  .object({
    /**
     * Human-readable explanation of what the skill provides.
     */
    description: z.string().trim().min(1),

    /**
     * Stable skill identifier agents reference in their manifests.
     */
    id: identifierSchema,

    /**
     * Optional relevance tokens for selective prompt injection.
     */
    keywords: z.array(z.string().trim().min(1)).default([]),

    /**
     * Path to the skill prompt file, relative to the manifest directory.
     */
    prompt_file: z.string().trim().min(1),
  })
  .strict()
  .superRefine((value, context) => {
    validateUniqueValues(value.keywords, 'keywords', context)
  })

/**
 * Parsed skill configuration from a validated manifest.
 */
export type SkillManifest = z.infer<typeof skillSchema>
