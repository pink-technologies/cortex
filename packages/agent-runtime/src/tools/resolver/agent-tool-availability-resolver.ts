// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { type LLMToolDefinition } from '@cortex/llm'
import { type AgentExecutionContext } from '@/execution'
import { type AgentToolAuthorizationPolicy } from '../authorization'
import { type AgentToolRegistry } from '../registry/agent-tool-registry'

/**
 * Resolves the language-model tool definitions available to one agent
 * execution.
 *
 * Loads the requested names via {@link AgentToolRegistry.definitionsFor}, then
 * filters them through {@link AgentToolAuthorizationPolicy.allows} for the
 * current {@link AgentExecutionContext}. Only authorized tools are returned
 * for exposure to the model.
 *
 * @typeParam Context - Runtime context used for authorization and cancellation.
 */
export class AgentToolAvailabilityResolver<Context extends AgentExecutionContext = AgentExecutionContext> {
  // MARK: - Constructor

  /**
   * Creates a tool availability resolver.
   *
   * @param registry - Registry that supplies registered tool definitions.
   * @param authorizationPolicy - Policy that decides which tools may be exposed.
   */
  constructor(
    private readonly registry: AgentToolRegistry<Context>,
    private readonly authorizationPolicy: AgentToolAuthorizationPolicy<Context>,
  ) {}

  // MARK: - Instance methods

  /**
   * Returns definitions for the named tools that are authorized in the given
   * execution context.
   *
   * Resolves definitions for `toolNames` in the same order via
   * {@link AgentToolRegistry.definitionsFor}, then keeps those for which
   * {@link AgentToolAuthorizationPolicy.allows} resolves to `true`.
   * Cancellation is checked before the walk and after each authorization check.
   *
   * @param toolNames - Registered tool names to consider, in caller order.
   * @param context - Runtime context for authorization and cancellation.
   * @returns Authorized language-model tool definitions in `toolNames` order.
   * @throws {@link AgentToolNotFoundError} when a requested name is not
   *   registered.
   */
  async resolve(toolNames: readonly string[], context: Context): Promise<readonly LLMToolDefinition[]> {
    context.signal.throwIfAborted()

    const allowedDefinitions: LLMToolDefinition[] = []
    const definitions = this.registry.definitionsFor(toolNames)

    for (const definition of definitions) {
      context.signal.throwIfAborted()

      const tool = this.registry.resolve(definition.name)
      const isAllowed = await this.authorizationPolicy.allows(tool.metadata, context)

      context.signal.throwIfAborted()

      if (isAllowed) {
        allowedDefinitions.push(definition)
      }
    }

    return allowedDefinitions
  }
}
