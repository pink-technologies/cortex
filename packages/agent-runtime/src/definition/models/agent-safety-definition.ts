// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Defines the permissions and delegation constraints enforced when an agent
 * executes.
 *
 * These values come from the `[safety]` block in `agent.toml`. They are runtime
 * policies and must be enforced by the agent kernel rather than treated only as
 * instructions for the language model.
 */
export interface AgentSafetyDefinition {
  /**
   * Whether the agent may invoke capabilities declared in its descriptor.
   *
   * When disabled, capability-backed tools must not be exposed to or executed
   * on behalf of the agent.
   */
  readonly allowCapabilityUse: boolean

  /**
   * Whether the agent may delegate work to other agents.
   *
   * Delegation is additionally restricted to the agent identifiers declared in
   * `AgentDescriptor.delegatesTo`.
   */
  readonly allowDelegation: boolean

  /**
   * Whether the agent may use skills declared in its descriptor.
   *
   * When disabled, skills must not be added to the agent's effective
   * instructions or invoked during execution.
   */
  readonly allowSkillUse: boolean

  /**
   * Maximum number of nested agent delegations permitted during one execution.
   *
   * A value of `0` prevents delegation even when `allowDelegation` is enabled.
   */
  readonly maximumDelegationDepth: number
}