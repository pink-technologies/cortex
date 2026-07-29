// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';

/**
 * Schema used to validate a skill manifest (`skill.toml`) for the definitions module.
 *
 * Describes stable identity, display metadata, a short description, and how skill
 * inputs are shaped via `[input].schema` (for example `json`). Prompt text is loaded
 * separately from companion files (for example `skill.md`) and passed to
 * {@link SkillDefinition.from}.
 */
export const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string(),
  input: z.object({
    schema: z.string(),
  }),
});
