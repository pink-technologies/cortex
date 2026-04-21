// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';

/**
 * One parameter for a capability input.
 */
export const capabilityParameterSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
});

/**
 * One capability input.
 */
export const capabilityInputSchema = z.object({
    id: z.string().min(1),
    description: z.string(),
    parameters: z.array(capabilityParameterSchema),
});

/**
 * Type for the capabilities input schema.
 */
export type CapabilityInputSchema = z.infer<typeof capabilityInputSchema>;