// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentDefinition } from '@/definition'
import type { AgentExecutionScope } from '../models'

/**
 * Resolves the {@link AgentExecutionScope} authorized for one agent execution.
 *
 * The resolver decides, before a run starts, which capabilities, skills, and
 * tools the execution may use. It combines the agent's declared resources
 * from {@link AgentDefinition.descriptor} with the run's requested tool names
 * and the definition's {@link AgentDefinition.safety} settings, producing the
 * allowlist the kernel and tool executor enforce for that single run.
 *
 * Keeping resolution separate from enforcement makes authorization policy a
 * single replaceable component: hosts can tighten or relax scoping (for
 * example, denying all capabilities regardless of the manifest) without
 * touching the execution loop.
 *
 * Responsibilities:
 * - derive the per-run allowlist from the definition and requested tools
 * - honor safety settings that disable a resource class for the agent
 * - fail closed: omit or reject undeclared and disallowed resources instead
 *   of granting them provisionally
 *
 * Non-responsibilities:
 * - enforcing the scope during execution (kernel and tool executor)
 * - validating wire payloads (handled by `@cortex/protocol` at the boundary)
 */
export interface AgentExecutionScopeResolver {
  /**
   * Resolves the execution scope for one run of the specified agent.
   *
   * Implementations may consult runtime catalogs (capabilities, skills,
   * tools) to validate that declared resources are available, which is why
   * resolution is asynchronous. Manifest-only implementations resolve
   * without I/O.
   *
   * @param definition - Static configuration of the agent being executed.
   * @param requestedToolNames - Tool names requested for this run; the
   *   resolved {@link AgentExecutionScope.toolNames} never exceeds this list.
   * @returns The allowlist of resources authorized for the execution.
   * @throws When a declared or requested resource fails the implementation's
   *   availability or authorization checks.
   */
  resolve(definition: AgentDefinition, requestedToolNames: readonly string[]): Promise<AgentExecutionScope>
}
