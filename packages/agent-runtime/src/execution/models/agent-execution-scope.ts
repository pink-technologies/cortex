// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Allowlist of resources one agent execution is authorized to use.
 *
 * Resolved locally by the runtime before an execution starts — from the agent
 * definition, the tools requested for the run, the registered capabilities,
 * and the runtime safety settings. The kernel and tool executor consult it to
 * decide what the agent may invoke during that single run.
 *
 * The scope is an authorization boundary, not a discovery mechanism: listing
 * an identifier here does not guarantee the resource exists, only that the
 * execution is permitted to use it when it does. Each list is exhaustive, so
 * an empty list denies that resource class entirely rather than allowing
 * everything.
 *
 * This is per-execution state, like {@link AgentExecutionContext} — not static
 * catalog configuration from {@link AgentDefinition}, and not a wire-level
 * protocol contract. Payloads that cross the API/Node boundary are validated
 * separately in `@cortex/protocol`.
 */
export interface AgentExecutionScope {
  /**
   * Capability identifiers the execution may invoke.
   *
   * Capabilities outside this list are withheld from the agent for the run
   * even when they are registered with the runtime. Empty means the execution
   * runs without capability access.
   */
  readonly capabilityIds: readonly string[]

  /**
   * Skill identifiers the execution may load.
   *
   * Skills outside this list are withheld from the agent for the run even
   * when they are registered with the runtime. Empty means the execution runs
   * without skill access.
   */
  readonly skillIds: readonly string[]

  /**
   * Tool names the execution may call.
   *
   * Matches {@link AgentTool.name} for tools in the runtime's tool registry.
   * Tools outside this list are not exposed to the LLM and are rejected if
   * requested. Empty means the execution runs without tools.
   */
  readonly toolNames: readonly string[]
}
