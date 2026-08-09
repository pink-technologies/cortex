// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates the safety block of an agent manifest (`safety`).
 *
 * Wire keys are snake_case to match manifest YAML/JSON. After loading, the
 * runtime maps this shape onto {@link AgentSafetyDefinition} (camelCase).
 *
 * These fields are runtime policies for the agent kernel—not prompt text.
 * Capability and skill allow-lists on the parent manifest still apply when the
 * corresponding flags are enabled; delegation is further limited by
 * `delegates_to` and {@link max_delegation_depth}.
 *
 * Unknown keys are rejected (`.strict()`).
 */
export const agentSafetySchema = z
  .object({
    /**
     * Whether the agent may invoke capabilities listed on its manifest.
     *
     * When `false`, capability-backed tools must not be exposed to or executed
     * for the agent. Mapped to {@link AgentSafetyDefinition.allowCapabilityUse}.
     */
    allow_capability_use:
      z.boolean(),

    /**
     * Whether the agent may delegate work to other agents.
     *
     * When `true`, targets are still restricted to identifiers in
     * `delegates_to`, and nesting is capped by {@link max_delegation_depth}.
     * Mapped to {@link AgentSafetyDefinition.allowDelegation}.
     */
    allow_delegation:
      z.boolean(),

    /**
     * Whether the agent may use skills listed on its manifest.
     *
     * When `false`, skills must not be merged into effective instructions or
     * invoked during execution. Mapped to
     * {@link AgentSafetyDefinition.allowSkillUse}.
     */
    allow_skill_use:
      z.boolean(),

    /**
     * Maximum nested delegation depth allowed in one execution.
     *
     * Must be a non-negative integer. `0` blocks delegation even when
     * {@link allow_delegation} is `true`. Mapped to
     * {@link AgentSafetyDefinition.maximumDelegationDepth}.
     */
    max_delegation_depth: z
      .number()
      .int()
      .nonnegative(),
  })
  .strict()

/**
 * Parsed safety configuration from an agent manifest's `safety` block.
 *
 * Inferred from {@link agentSafetySchema}. Prefer {@link AgentSafetyDefinition}
 * in runtime code after the loader normalizes field names.
 */
export type AgentSafetyManifest = z.infer<typeof agentSafetySchema>
