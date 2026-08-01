// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Describes one capability available to Cortex agents.
 *
 * A capability is a named authorization/catalog entry: a bundle of related
 * tools that an agent definition can reference through
 * `AgentDescriptor.capabilities`. The catalog entry tells Cortex what the
 * capability provides—its stable identifier, a human-readable description, and
 * the tool names contributed when an agent is authorized to use it.
 *
 * Capability ids often match job kinds (for example `repository.review` or
 * `jira.triage`) so Node can route work via {@link defaultAgentId}. The
 * executable job entrypoints themselves live in the Node **handlers** layer;
 * this type is metadata only.
 *
 * Capability definitions hold no credentials, executable code, or per-run
 * state—tools referenced here are executed through the runtime's tool registry.
 */
export interface CapabilityDefinition {
  /**
   * Optional default agent id that owns this capability for job routing.
   */
  readonly defaultAgentId?: string

  /**
   * Human-readable explanation of what the capability provides.
   */
  readonly description: string

  /**
   * Stable identifier agents use to reference the capability (for example
   * `repository.review`).
   */
  readonly id: string

  /**
   * Names of the tools this capability contributes to authorized executions.
   *
   * Each entry should match an `AgentTool.name` registered with the runtime's
   * tool registry. An empty list is valid for marker capabilities that gate
   * behavior without exposing tools.
   */
  readonly toolNames: readonly string[]
}
