// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { agentSchema } from '@/agents/schema/agent/agent-schema';
import { CapabilityInputSchema } from "@/capabilities/schema/input/capability-input.schema";
import { LLMModel } from "@/llm";
import { ConversationMessage } from "@/shared/types/input/execution-input";
import { SkillInputSchema } from "@/skills/schema/input/skill-input.schema";
import z from 'zod';

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
} as const;

/** Union of string literals in {@link AgentRole}. */
export type AgentRole = (typeof AgentRole)[keyof typeof AgentRole];

/**
 * Static configuration for an {@link AgentDefinition}: display name, role, and what skills/capabilities
 * it may use. Typically immutable for the lifetime of the registered agent.
 */
export interface AgentDescriptor {
  /**
   * Capability ids (e.g. manifest keys) this agent is associated with for routing or reasoning.
   */
  readonly capabilities: readonly string[];

  /**
   * Optional description for routing/discovery.
   */
  readonly description?: string;

  /**
   * Human-readable agent name.
   */
  readonly name: string;

  /**
   * High-level role in the system ({@link AgentRole}).
   */
  readonly role: (typeof AgentRole)[keyof typeof AgentRole];

  /**
   * Skill ids this agent may invoke via {@link AgentDecisionType.UseSkill} (enforce in orchestration).
   */
  readonly skills: readonly string[];

  /**
   * System instructions prepended to the LLM for every {@link PromptDrivenAgent.decide} call; loaded from the manifest’s prompt file.
   */
  readonly systemPrompt: string;
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
  readonly id: string;

  /**
   * Static metadata and behavioral configuration for the agent.
   *
   * The descriptor includes the agent name, description, role, available skills,
   * available capabilities, and resolved system prompt.
   */
  readonly descriptor: AgentDescriptor;

  // MARK: - Constructor

  /**
   * Creates an agent definition.
   *
   * @param id - The stable identifier of the agent definition.
   * @param descriptor - The static descriptor associated with the agent.
   */
  constructor(id: string, descriptor: AgentDescriptor) {
    this.id = id
    this.descriptor = descriptor
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
      description: schema.description,
      role: schema.role,
      skills: schema.skills,
      systemPrompt: systemPrompt
    })
  }
}

/**
 * Discriminator values for {@link AgentDecision}.
 *
 * @property Delegate — Hand off to another agent by id.
 * @property Respond — Plain-text reply (no further agent hop in this step).
 * @property SuggestCapability — Suggest a capability to the user.
 * @property SuggestSkill — Suggest a skill to the user.
 * @property SuggestOptions — Suggest both capabilities and skills in one turn (mixed discovery / orientation).
 * @property UseCapability — Invoke a registered capability with structured input.
 * @property UseSkill — Invoke a registered skill with structured input.
 */
export const AgentDecisionType = {
  Delegate: 'delegate',
  Respond: 'respond',
  SuggestCapability: 'suggest-capability',
  SuggestSkill: 'suggest-skill',
  SuggestOptions: 'suggest-options',
  UseCapability: 'use-capability',
  UseSkill: 'use-skill',
} as const;

/** Union of string literals in {@link AgentDecisionType}. */
export type AgentDecisionType = (typeof AgentDecisionType)[keyof typeof AgentDecisionType];

/**
 * Represents the next action selected by an agent for a single execution turn.
 *
 * `AgentDecision` is a discriminated union. The `type` field determines which
 * action the runtime should perform next, such as delegating to another agent,
 * responding directly to the user, suggesting available actions, or invoking a
 * skill or capability.
 *
 * Agent decisions are produced by executable agents and interpreted by the
 * kernel or orchestrator. The agent describes what should happen, while the
 * runtime remains responsible for enforcing safety rules, executing skills and
 * capabilities, handling delegation depth, and returning final responses.
 */
export type AgentDecision =
  /**
   * Delegates the current task to another agent.
   *
   * The target agent is resolved using `agentId`. The optional `reason` explains
   * why delegation is appropriate and can be used for tracing, debugging, or
   * audit logs.
   */
  | {
      readonly type: typeof AgentDecisionType.Delegate;
      readonly agentId: string;
      readonly reason?: string;
    }

  /**
   * Returns a direct response to the user.
   *
   * This decision ends the current turn with a user-facing message.
   */
  | {
      readonly type: typeof AgentDecisionType.Respond;
      readonly response: string;
    }

  /**
   * Suggests one or more capabilities that may help satisfy the request.
   *
   * This decision is useful when the agent identifies relevant capabilities but
   * should not invoke them directly, usually because user confirmation, missing
   * input, or policy approval is required.
   */
  | {
      readonly type: typeof AgentDecisionType.SuggestCapability;
      readonly message: string;
      readonly capabilities: CapabilityInputSchema[];
    }

  /**
   * Suggests one or more skills that may help satisfy the request.
   *
   * This decision is useful when the agent identifies relevant skills but should
   * not execute them directly, usually because user confirmation, missing input,
   * or policy approval is required.
   */
  | {
      readonly type: typeof AgentDecisionType.SuggestSkill;
      readonly message: string;
      readonly skills: SkillInputSchema[];
    }

  /**
   * Suggests a combined set of capabilities and skills.
   *
   * This decision is useful when the agent can offer multiple possible execution
   * paths and the user or runtime should choose which action to take.
   */
  | {
      readonly type: typeof AgentDecisionType.SuggestOptions;
      readonly message: string;
      readonly capabilities: CapabilityInputSchema[];
      readonly skills: SkillInputSchema[];
    }

  /**
   * Requests execution of a capability.
   *
   * Capabilities usually represent integration-backed operations or tool
   * bundles. The runtime is responsible for validating access, enforcing safety
   * policy, resolving the capability implementation, and executing it with the
   * provided input.
   */
  | {
      readonly type: typeof AgentDecisionType.UseCapability;
      readonly capabilityId: string;
      readonly input: Record<string, unknown>;
      readonly userMessage: string;
    }

  /**
   * Requests execution of a skill.
   *
   * Skills represent structured workflows or reasoning behaviors available to
   * the agent. The runtime is responsible for validating access, resolving the
   * skill implementation, and executing it with the provided input.
   */
  | {
      readonly type: typeof AgentDecisionType.UseSkill;
      readonly skillId: string;
      readonly input: Record<string, unknown>;
    };

/**
 * Static wiring for a {@link PromptDrivenAgent}: identity, persona, LLM port, prompt text, and optional delegates.
 *
 * Built by {@link AgentService} from bundled `agent.toml` (and the referenced prompt file), not registered as a Nest provider.
 */
export interface AgentConfiguration {
  /**
   * Display name, {@link AgentDescriptor.role | role}, allowed skills, capabilities, and description for prompts / routing.
   */
  readonly descriptor: AgentDescriptor;

  /**
   * Chat model id for {@link PromptDrivenAgent.decide} (typically the app default from `LLM_DEFAULT_MODEL`).
   */
  readonly model: LLMModel;

  /**
   * Agent ids this instance may hand off to via **delegate**; listed in the user prompt as available delegates.
   * Omitted or empty when the agent never delegates. Matches manifest `delegates_to` when present.
   */
  readonly delegateAgentIds?: readonly string[];

  /**
   * System instructions prepended to the LLM for every {@link PromptDrivenAgent.decide} call; loaded from the manifest’s prompt file.
   */
  readonly systemPrompt: string;
}

/**
 * Per-turn input to {@link AgentDefinition.decide}: correlates with a single user message within a run.
 *
 * Aligns conceptually with shared {@link ExecutionContext} fields where the kernel passes
 * execution id and message into the agent layer.
 */
export interface AgentContext {
  /**
   * Correlates logs, tool calls, and nested hops for this execution (e.g. UUID/ULID).
   */
  readonly executionId: string;

  /**
   * Normalized user utterance for this decision step.
   */
  readonly message: string;

  /**
   * Full thread for LLM replay (same shape as {@link ConversationMessage}).
   */
  readonly conversationHistory?: readonly ConversationMessage[];
}

/**
 * A registered agent: stable id, {@link AgentDescriptor}, and a pure decision function for one turn.
 *
 * Implementations are stored in {@link AgentRegistry} and invoked by the kernel or orchestrator
 * after resolving which agent should act.
 */
export interface Agent {
  /**
   * Stable key used in {@link AgentRegistry} and in {@link AgentDecision} when delegating.
   */
  readonly id: string;

  /**
   * Decides the next step for this turn: delegate, respond, or invoke a skill.
   *
   * @param context - Current execution id and user message for this decision.
   * @returns A single {@link AgentDecision}; callers interpret and act (loop, respond, execute skill).
   */
  decide(context: AgentContext): Promise<AgentDecision[]>;
}