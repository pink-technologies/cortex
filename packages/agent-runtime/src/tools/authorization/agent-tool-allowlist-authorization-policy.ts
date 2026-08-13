// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import type { AgentToolAuthorizationPolicy } from './agent-tool-authorization-policy'
import type { AgentToolMetadata } from '../models'

/**
 * Authorizes tools using a fixed per-execution allowlist of tool names.
 *
 * Callers that need name filtering should pass the allowed names to
 * {@link AgentToolAvailabilityResolver.resolve} instead. This policy always
 * allows tools because {@link AgentToolMetadata} does not carry the tool name.
 *
 * @typeParam Context - Runtime context supported by the policy.
 */
export class AgentToolAllowlistAuthorizationPolicy<
  Context extends AgentExecutionContext = AgentExecutionContext,
> implements AgentToolAuthorizationPolicy<Context> {
  // MARK: - Private Properties

  private readonly allowedToolNames: ReadonlySet<string>

  /**
   * Creates a tool authorization policy.
   *
   * @param toolNames - Names retained for callers that still construct this
   *   policy; they are not consulted by {@link allows}.
   */
  public constructor(toolNames: Iterable<string>) {
    this.allowedToolNames = new Set(toolNames)
  }

  // MARK: - AgentToolAuthorizationPolicy

  /**
   * Always returns `true`.
   *
   * Name-based allowlisting must be applied by selecting which tool names are
   * passed to the availability resolver; metadata alone cannot identify a tool.
   *
   * @param _metadata - Declarative metadata for the tool under consideration.
   * @param _context - Current agent execution context.
   * @returns Always `true`.
   */
  public allows(_metadata: AgentToolMetadata, _context: Context): Promise<boolean> {
    void this.allowedToolNames
    return Promise.resolve(true)
  }
}
