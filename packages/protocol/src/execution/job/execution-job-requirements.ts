// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates worker-selection constraints persisted as `ExecutionJob.requirements`.
 *
 * The claim path matches these against a Node's capabilities and labels. The
 * schema is strict so corrupt or drifted JSON fails closed instead of being
 * cast into an unchecked TypeScript shape.
 */
export const ExecutionJobRequirementsSchema = z
  .object({
    /**
     * Capability ids the worker must expose (AND).
     *
     * An empty array means no required capabilities.
     */
    allOf: z.array(z.string().trim().min(1)),

    /**
     * Capability ids of which the worker must expose at least one (OR).
     */
    anyOf: z.array(z.string().trim().min(1)).optional(),

    /**
     * Capability ids the worker must not expose (NOT).
     */
    noneOf: z.array(z.string().trim().min(1)).optional(),

    /**
     * Optional label filters the worker must satisfy.
     */
    labels: z.array(z.string().trim().min(1)).optional(),
  })
  .strict()

/**
 * Validated execution-job requirements exchanged through persistence and claim.
 *
 * Derived from {@link ExecutionJobRequirementsSchema} so runtime validation and
 * the TypeScript representation remain aligned.
 */
export type ExecutionJobRequirements = z.infer<typeof ExecutionJobRequirementsSchema>
