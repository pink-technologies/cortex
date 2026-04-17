// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { CapabilityInputSchema } from "@/capabilities/schema/input/capability-input.schema";
import { ConversationMessage } from "@/shared/types/input/execution-input";
import { SkillInputSchema } from "@/skills/schema/input/skill-input.schema";

/**
 * High-level persona / responsibility label for an agent.
 *
 * Used in {@link AgentDescriptor.role} and for UX or routing hints (not a security boundary by itself).
 *
 * @property Assistant — General assistant behavior.
 * @property Specialist — Focused domain or task specialist.
 */
export const AgentRole = {
  Assistant: 'Assistant',
  Specialist: 'Specialist',
} as const;

/**
 * Discriminator values for {@link AgentDecision}.
 *
 * @property Delegate — Hand off to another agent by id.
 * @property Respond — Plain-text reply (no further agent hop in this step).
 * @property SuggestCapability — Suggest a capability to the user.
 * @property SuggestSkill — Suggest a skill to the user.
 * @property SuggestOptions — Suggest both capabilities and skills in one turn (mixed discovery / orientation).
 * @property UseSkill — Invoke a registered skill with structured input.
 * @property UseCapability — Invoke a registered capability with structured input.
 */
export const AgentDecisionType = {
  Delegate: 'delegate',
  Respond: 'respond',
  SuggestCapability: 'suggest-capability',
  SuggestSkill: 'suggest-skill',
  SuggestOptions: 'suggest-options',
  UseSkill: 'use-skill',
  UseCapability: 'use-capability',
} as const;

/** Union of string literals in {@link AgentDecisionType}. */
export type AgentDecisionType = (typeof AgentDecisionType)[keyof typeof AgentDecisionType];

/** Union of string literals in {@link AgentRole}. */
export type AgentRole = (typeof AgentRole)[keyof typeof AgentRole];

/**
 * Outcome of one decide call — a tagged union on `type`.
 *
 * - **delegate** — Route processing to another agent; optional human-readable `reason`.
 * - **respond** — Final natural-language string.
 * - **suggest-capability** — Suggest a capability to the user with a message and structured capabilities.
 * - **suggest-skill** — Suggest a skill to the user with a message and structured skills.
 * - **suggest-options** — Same turn: structured **capabilities** (discovery) **and** relevant **skills** from the allow-list, plus one cohesive **`message`** (e.g. “for the ticket I need …; for the summary you can use …”).
 * - **use-capability** — Run a capability by id with JSON-like `input` (validated by the capability layer)
 *   plus `userMessage`: natural-language line the user sees (**always** match the user’s language;
 *   for discovery runs this is the intro/summary; structured options come from the executor result).
 * - **use-skill** — Run a skill by id with opaque JSON-like `input` (validated by the skill layer).
 */
export type AgentDecision =
  | {
    readonly type: typeof AgentDecisionType.Delegate,
    readonly agentId: string;
    readonly reason?: string
  }
  | {
    readonly type: typeof AgentDecisionType.Respond,
    readonly response: string
  }
  | {
    readonly type: typeof AgentDecisionType.SuggestCapability,
    readonly message: string,
    readonly capabilities: CapabilityInputSchema[]
  }
  | {
    readonly type: typeof AgentDecisionType.SuggestSkill,
    readonly message: string,
    readonly skills: SkillInputSchema[]
  }
  | {
    readonly type: typeof AgentDecisionType.SuggestOptions,
    readonly message: string,
    readonly capabilities: CapabilityInputSchema[],
    readonly skills: SkillInputSchema[],
  }
  | {
    readonly type: typeof AgentDecisionType.UseSkill,
    readonly skillId: string;
    readonly input: Record<string, unknown>
  }
  | {
    readonly type: typeof AgentDecisionType.UseCapability,
    readonly capabilityId: string;
    readonly input: Record<string, unknown>;
    readonly userMessage: string;
  };

/**
 * Static configuration for an {@link Agent}: display name, role, and what skills/capabilities
 * it may use. Typically immutable for the lifetime of the registered agent.
 */
export interface AgentDescriptor {
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
   * Capability ids (e.g. manifest keys) this agent is associated with for routing or reasoning.
   */
  readonly capabilities: readonly string[];

  /**
   * Optional description for routing/discovery.
   */
  readonly description?: string;
}

/**
 * Per-turn input to {@link Agent.decide}: correlates with a single user message within a run.
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
   * Static metadata.
   */
  readonly descriptor: AgentDescriptor;

  /**
   * Decides ordered steps for this turn (delegate, respond, use-skill, etc.).
   *
   * @param context - Current execution id and user message for this decision.
   * @returns The decision to be executed by the kernel.
   */
  decide(context: AgentContext): Promise<AgentDecision[]>;
}
