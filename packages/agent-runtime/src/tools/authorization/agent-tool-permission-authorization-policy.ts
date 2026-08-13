// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import type { AgentToolAuthorizationPolicy } from './agent-tool-authorization-policy'
import type { AgentToolMetadata } from '../models'

/**
 * Authorizes tools by comparing each tool's required permissions with those
 * granted on the {@link AgentExecutionContext}.
 *
 * A tool is allowed when every permission declared in
 * {@link AgentToolMetadata.permissions} is present in
 * {@link AgentExecutionContext.permissions}. Tools that declare no permissions
 * are always allowed.
 *
 * @typeParam Context - Runtime context supported by the policy.
 */
export class AgentToolPermissionAuthorizationPolicy<
  Context extends AgentExecutionContext = AgentExecutionContext,
> implements AgentToolAuthorizationPolicy<Context> {
  // MARK: - AgentToolAuthorizationPolicy

  /**
   * Determines whether the tool described by `metadata` may be exposed or
   * executed for this run.
   *
   * @param metadata - Declarative effect, idempotency, and permission metadata
   *   for the tool under consideration.
   * @param context - Current agent execution context.
   * @returns `true` when every required permission is granted; otherwise
   *   `false`.
   */
  async allows(metadata: AgentToolMetadata, context: Context): Promise<boolean> {
    return metadata.permissions.every((permission) => context.permissions.has(permission))
  }
}
