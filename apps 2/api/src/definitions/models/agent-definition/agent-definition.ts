// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import z from 'zod'
import { agentSchema } from '@/definitions/schema/agent/agent-schema'
import { LLMProviderType } from '@/llm'

/**
 * High-level persona / responsibility label for an agent.
 *
 * Used in {@link AgentDescriptor.role} and for UX or routing hints (not a security boundary by itself).
 *
 * @property Assistant — General assistant behavior.
 * @property Specialist — Focused domain or task specialist.
 */
export const AgentRole = {
  Main: 'main',
  Specialist: 'specialist',
} as const

/** Union of string literals in {@link AgentRole}. */
export type AgentRole = (typeof AgentRole)[keyof typeof AgentRole]

/**
 * Static configuration for an {@link AgentDefinition}: display name, role, and what skills/capabilities
 * it may use. Typically immutable for the lifetime of the registered agent.
 */
export interface AgentDescriptor {
  /**
   * Capability ids (e.g. manifest keys) this agent is associated with for routing or reasoning.
   */
  readonly capabilities: readonly string[]

  /**
   * Agent ids this agent may target with a **delegate** decision.
   */
  readonly delegatesTo: readonly string[]

  /**
   * Optional description for routing/discovery.
   */
  readonly description?: string

  /**
   * Human-readable agent name.
   */
  readonly name: string

  /**
   * High-level role in the system ({@link AgentRole}).
   */
  readonly role: AgentRole

  /**
   * Skill ids this agent may invoke via {@link AgentDecisionType.UseSkill} (enforce in orchestration).
   */
  readonly skills: readonly string[]

  /**
   * System instructions prepended to the LLM for every {@link PromptDrivenAgent.decide} call; loaded from the manifest’s prompt file.
   */
  readonly systemPrompt: string
}

/**
 * Default language-model settings for an {@link AgentDefinition}, loaded from the
 * `[llm]` block in `agent.toml`.
 *
 * This is **catalog metadata only**: it describes which provider and model the agent
 * template expects and how aggressively to sample. It does **not** include API keys
 * or installation-specific connection ids — those are resolved at run time per
 * installation and used when building the {@link LLM} client.
 *
 * Kept as a sibling of {@link AgentDescriptor} (not inside the descriptor) so
 * persona/routing fields stay separate from vendor call parameters.
 *
 * @example
 * ```toml
 * [llm]
 * provider = "openAI"
 * model = "gpt-5.4"
 * max_tokens = 300
 * temperature = 0.2
 * ```
 */
export interface AgentLLMSpec {
  /**
   * Provider implementation used to build the {@link LLM} client (for example OpenAI).
   *
   * Maps to `[llm].provider` in `agent.toml`. A run-time resolver uses this value to
   * select which installation-stored credential to load.
   */
  readonly provider: LLMProviderType

  /**
   * Model id passed to {@link LLM.chat} on each {@link Agent.decide} call.
   *
   * Maps to `[llm].model`. An installation may override the effective model while
   * keeping the same agent template.
   */
  readonly model: string

  /**
   * Upper bound on completion tokens for a single decision request.
   *
   * Maps to `[llm].max_tokens` in the manifest.
   */
  readonly maxTokens: number

  /**
   * Sampling temperature for decision generation (`[llm].temperature`).
   *
   * Lower values yield more deterministic routing; higher values allow more variation.
   */
  readonly temperature: number
}

/**
 * Defines the static configuration of an agent available to the runtime.
 *
 * `AgentDefinition` represents the organization-agnostic metadata loaded from
 * an agent manifest, such as `agent.toml`, together with the resolved system
 * prompt. It describes what the agent is, which role it has, which skills and
 * capabilities it may use, and how it can be referenced by other agents.
 *
 * An `AgentDefinition` is not directly executable. Runtime components combine
 * this definition with organization-scoped dependencies, such as an LLM client,
 * credentials, model settings, and execution context, to create an executable
 * agent capable of making decisions.
 */
export class AgentDefinition {
  /**
   * Stable identifier for the agent definition.
   *
   * This value is used to register and resolve the definition from the agent
   * catalog, and it is also used by `AgentDecision` values when delegating work
   * to another agent.
   */
  readonly id: string

  /**
   * Static metadata and behavioral configuration for the agent.
   *
   * The descriptor includes the agent name, description, role, available skills,
   * available capabilities, and resolved system prompt.
   */
  readonly descriptor: AgentDescriptor

  /**
   * Static configuration for the LLM used by the agent.
   */
  readonly llm: AgentLLMSpec

  // MARK: - Constructor

  /**
   * Creates an agent definition.
   *
   * @param id - The stable identifier of the agent definition.
   * @param descriptor - The static descriptor associated with the agent.
   */
  constructor(id: string, descriptor: AgentDescriptor, llm: AgentLLMSpec) {
    this.id = id
    this.descriptor = descriptor
    this.llm = llm
  }

  // MARK: - Static methods

  /**
   * Creates a new agent from a schema.
   *
   * @param schema - The schema of the agent.
   * @param systemPrompt - The system prompt of the agent.
   * @returns The agent.
   */
  static from(schema: z.infer<typeof agentSchema>, systemPrompt: string): AgentDefinition {
    return new AgentDefinition(schema.id, {
      name: schema.name,
      capabilities: schema.capabilities,
      delegatesTo: schema.delegates_to,
      description: schema.description,
      role: schema.role,
      skills: schema.skills,
      systemPrompt: systemPrompt,
    }, {
      provider: schema.llm.provider,
      model: schema.llm.model,
      maxTokens: schema.llm.max_tokens,
      temperature: schema.llm.temperature,
    });
  }
}
