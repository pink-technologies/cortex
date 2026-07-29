// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';

/**
 * Schema used to validate a skill definition exposed to an agent.
 *
 * A skill represents a logic-oriented action the agent can request during
 * decision execution, such as rewriting text, generating content, or
 * interpreting data.
 */
export const skillSchema = z.object({
  id: z.string().min(1),
  description: z.string(),
});
