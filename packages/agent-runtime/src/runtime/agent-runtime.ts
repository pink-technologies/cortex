// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentFactory } from '@/agent'
import { AgentDefinitionRegistry } from '@/definition/registry/agent-definition-registry'
import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import { Kernel, type KernelResult } from '@/kernel'
import { AgentToolAvailabilityResolver } from '@/tools/resolver'
import type { AgentRuntimeRequest } from './models'

/**
 * Primary facade for executing registered Cortex agents.
 *
 * Resolves an {@link AgentDefinition} by id, creates an executable agent,
 * resolves authorized tool definitions for the requested names via
 * {@link AgentToolAvailabilityResolver}, and delegates the multi-turn
 * lifecycle to the {@link Kernel}.
 */
export class AgentRuntime<Context extends AgentExecutionContext = AgentExecutionContext> {
  // MARK: - Private Properties

  private readonly agentFactory: AgentFactory
  private readonly definitionRegistry: AgentDefinitionRegistry
  private readonly kernel: Kernel<Context>
  private readonly toolResolver: AgentToolAvailabilityResolver<Context>

  // MARK: - Constructor

  /**
   * Creates an agent runtime.
   *
   * @param agentFactory - Factory used to create executable agents from
   *   definitions.
   * @param definitionRegistry - Registry of loaded agent definitions.
   * @param kernel - Kernel that owns the multi-turn execution loop.
   * @param toolResolver - Resolver that maps requested tool names to
   *   authorized language-model tool definitions for the execution.
   */
  constructor(
    agentFactory: AgentFactory,
    definitionRegistry: AgentDefinitionRegistry,
    kernel: Kernel,
    toolResolver: AgentToolAvailabilityResolver,
  ) {
    this.agentFactory = agentFactory
    this.definitionRegistry = definitionRegistry
    this.kernel = kernel
    this.toolResolver = toolResolver
  }

  // MARK: - Instance methods

  /**
   * Executes a registered agent for one request.
   *
   * Flow:
   * 1. Resolve {@link AgentRuntimeRequest.agentId} from the definition registry.
   * 2. Create an executable agent via {@link AgentFactory.create}.
   * 3. Resolve authorized tool definitions for
   *    {@link AgentRuntimeRequest.toolNames} through
   *    {@link AgentToolAvailabilityResolver.resolve}.
   * 4. Hand the agent, messages, and tools to {@link Kernel.execute}.
   *
   * Cancellation is checked before definition resolution, after agent and
   * tool resolution, and is otherwise honored via {@link AgentExecutionContext.signal}.
   *
   * @param request - Agent id, initial conversation, and requested tool names.
   * @param context - Execution correlation, permissions, and cancellation.
   * @returns The completed kernel result for the run.
   * @throws {@link AgentDefinitionNotFoundError} when the agent id is unknown.
   * @throws {@link AgentToolNotFoundError} when a requested tool name is not
   *   registered.
   */
  async execute(request: AgentRuntimeRequest, context: Context): Promise<KernelResult> {
    context.signal.throwIfAborted()

    const definition = this.definitionRegistry.resolve(request.agentId)
    const agent = await this.agentFactory.create(definition)
    const tools = await this.toolResolver.resolve(request.toolNames, context)

    context.signal.throwIfAborted()

    return this.kernel.execute(
      {
        agent,
        messages: request.messages,
        tools,
      },
      context,
    )
  }
}
