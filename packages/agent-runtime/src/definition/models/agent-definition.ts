// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'
import { agentSchema } from '../schema/agent-schema'
import type { AgentExecutionDefinition } from './agent-execution-definition'
import type { AgentLLMDefinition } from './agent-llm-definition'
import { AgentRole } from './agent-role'
import type { AgentSafetyDefinition } from './agent-safety-definition'

/**
 * Describes the identity, behavior, and relationships of an agent.
 *
 * The descriptor contains organization-independent information loaded from the
 * agent manifest. It does not include runtime state, credentials, or execution
 * dependencies.
 */
export interface AgentDescriptor {
  /**
   * Capability identifiers the agent is authorized to use.
   */
  readonly capabilities: readonly string[]

  /**
   * Agent identifiers to which this agent may delegate work.
   */
  readonly delegatesTo: readonly string[]

  /**
   * Optional description of the agent's purpose.
   */
  readonly description?: string

  /**
   * Human-readable name of the agent.
   */
  readonly name: string

  /**
   * Responsibility assigned to the agent.
   */
  readonly role: AgentRole

  /**
   * Skill identifiers available to the agent.
   */
  readonly skills: readonly string[]

  /**
   * System instructions applied to language model requests made by the agent.
   */
  readonly systemPrompt: string
}

/**
 * Defines the static configuration of an agent available to the runtime.
 *
 * An agent definition is loaded from an agent manifest such as `agent.toml`.
 * It describes the agent's identity, language-model configuration, execution
 * limits, permissions, and resolved system prompt.
 *
 * An `AgentDefinition` is not directly executable. Runtime components combine
 * the definition with an LLM client, registered tools, and an execution context
 * to create an executable agent.
 */
export class AgentDefinition {
  /**
   * Stable identifier used to register and resolve the agent.
   */
  readonly id: string

  /**
   * Identity, behavior, and relationships associated with the agent.
   */
  readonly descriptor: AgentDescriptor

  /**
   * Language-model configuration used by the agent.
   */
  readonly llm: AgentLLMDefinition

  /**
   * Limits applied to each execution of the agent.
   */
  readonly execution: AgentExecutionDefinition

  /**
   * Permissions and delegation constraints applied to the agent.
   */
  readonly safety: AgentSafetyDefinition

  // MARK: - Constructor

  /**
   * Creates an agent definition.
   *
   * @param id - The stable identifier of the agent.
   * @param descriptor - The identity and behavioral configuration of the agent.
   * @param llm - The language-model configuration of the agent.
   * @param execution - The limits applied to agent executions.
   * @param safety - The permissions and delegation constraints of the agent.
   */
  constructor(
    id: string,
    descriptor: AgentDescriptor,
    llm: AgentLLMDefinition,
    execution: AgentExecutionDefinition,
    safety: AgentSafetyDefinition,
  ) {
    this.id = id
    this.descriptor = descriptor
    this.llm = llm
    this.execution = execution
    this.safety = safety
  }

  // MARK: - Static methods

  /**
   * Creates an agent definition from a validated agent manifest.
   *
   * @param schema - The validated agent manifest.
   * @param systemPrompt - The resolved system prompt associated with the agent.
   * @returns A configured agent definition.
   */
  static from(schema: z.infer<typeof agentSchema>, systemPrompt: string): AgentDefinition {
    return new AgentDefinition(
      schema.id,
      {
        capabilities: schema.capabilities,
        delegatesTo: schema.delegates_to,
        description: schema.description,
        name: schema.name,
        role: schema.role,
        skills: schema.skills,
        systemPrompt,
      },
      {
        maximumOutputTokens: schema.llm.max_tokens,
        model: schema.llm.model,
        provider: schema.llm.provider,
        temperature: schema.llm.temperature,
      },
      {
        maximumIterations: schema.execution.max_iterations,
        timeoutMilliseconds: schema.execution.timeout_ms,
      },
      {
        allowCapabilityUse: schema.safety.allow_capability_use,
        allowDelegation: schema.safety.allow_delegation,
        allowSkillUse: schema.safety.allow_skill_use,
        maximumDelegationDepth: schema.safety.max_delegation_depth,
      },
    )
  }
}