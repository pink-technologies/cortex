// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';

/**
 * One skill input.
 */
export const skillInputSchema = z.object({
    id: z.string().min(1),
    description: z.string(),
});

/**
 * Type for the skill input schema.
 */
export type SkillInputSchema = z.infer<typeof skillInputSchema>;