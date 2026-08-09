// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentFactory } from '@/agent'
import { AgentDefinitionRegistry } from '@/definition/registry/agent-definition-registry'
import type { AgentExecutionContext } from '@/execution/agent-execution-context'
import type { AgentExecutionScopeResolver } from '@/execution/'
import { Kernel, type KernelResult } from '@/kernel'
import { AgentToolRegistry } from '@/tool'
import type { AgentRuntimeRequest } from './models'

/**
 * Provides the primary facade for executing registered Cortex agents.
 *
 * The runtime resolves an agent definition, determines the resources
 * authorized for the execution, creates the executable agent, and delegates
 * the multi-turn lifecycle to the {@link Kernel}.
 */
export class AgentRuntime {
  // MARK: - Private Properties

  private readonly agentFactory: AgentFactory
  private readonly definitionRegistry: AgentDefinitionRegistry
  private readonly executionScopeResolver: AgentExecutionScopeResolver
  private readonly kernel: Kernel
  private readonly toolRegistry: AgentToolRegistry

  // MARK: - Constructor

  /**
   * Creates an agent runtime.
   *
   * @param agentFactory - Factory used to create executable agents.
   * @param definitionRegistry - Registry containing loaded agent definitions.
   * @param executionScopeResolver - Resolver that determines the resources
   *   authorized for each execution.
   * @param kernel - Kernel responsible for the execution loop.
   * @param toolRegistry - Registry containing executable tools.
   */
  constructor(
    agentFactory: AgentFactory,
    definitionRegistry: AgentDefinitionRegistry,
    executionScopeResolver: AgentExecutionScopeResolver,
    kernel: Kernel,
    toolRegistry: AgentToolRegistry,
  ) {
    this.agentFactory = agentFactory
    this.definitionRegistry = definitionRegistry
    this.executionScopeResolver = executionScopeResolver
    this.kernel = kernel
    this.toolRegistry = toolRegistry
  }

  // MARK: - Instance Methods

  /**
   * Executes a registered agent.
   *
   * Tool names supplied by the request are treated as requested resources.
   * The execution-scope resolver determines which tools are authorized before
   * the runtime exposes their definitions to the agent.
   *
   * @param request - Agent identifier, initial conversation, and requested
   *   tools.
   * @param context - Execution correlation and cancellation information.
   * @returns The completed kernel result.
   */
  async execute(request: AgentRuntimeRequest, context: AgentExecutionContext): Promise<KernelResult> {
    context.signal.throwIfAborted()

    const definition = this.definitionRegistry.resolve(request.agentId)
    const scope = await this.executionScopeResolver.resolve(definition, request.toolNames)

    context.signal.throwIfAborted()

    const agent = await this.agentFactory.create(definition)

    context.signal.throwIfAborted()

    const tools = this.toolRegistry.definitionsFor(scope.toolNames)

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
