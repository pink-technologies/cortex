// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentExecutionContext } from '../execution/agent-execution-context'
import { AgentFactory } from '../agent'
import { AgentDefinitionRegistry } from '../definition/registry/agent-definition-registry'
import type { AgentRuntimeRequest } from './models'
import { AgentToolRegistry } from '../tool'
import { Kernel, KernelResult } from '../kernel'

/**
 * Provides the primary facade for executing registered Cortex agents.
 *
 * The runtime resolves an agent definition, creates the executable agent,
 * exposes the explicitly allowed tools, and delegates the multi-turn lifecycle
 * to the {@link Kernel}.
 */
export class AgentRuntime {
  // MARK: - Private Properties

  private readonly agentFactory: AgentFactory
  private readonly definitionRegistry: AgentDefinitionRegistry
  private readonly kernel: Kernel
  private readonly toolRegistry: AgentToolRegistry

  // MARK: - Constructor

  /**
   * Creates an agent runtime.
   *
   * @param agentFactory - Factory used to create executable agents.
   * @param definitionRegistry - Registry containing loaded agent definitions.
   * @param kernel - Kernel responsible for the execution loop.
   * @param toolRegistry - Registry containing executable tools.
   */
  constructor(
    agentFactory: AgentFactory,
    definitionRegistry: AgentDefinitionRegistry,
    kernel: Kernel,
    toolRegistry: AgentToolRegistry,
  ) {
    this.agentFactory = agentFactory
    this.definitionRegistry = definitionRegistry
    this.kernel = kernel
    this.toolRegistry = toolRegistry
  }

  // MARK: - Instance Methods

  /**
   * Executes a registered agent.
   *
   * The requested tool names form the execution allowlist. Tools registered in
   * the runtime but absent from the request are not exposed to the agent.
   *
   * @param request - Agent identifier, initial conversation, and allowed tools.
   * @param context - Execution correlation and cancellation information.
   * @returns The completed kernel result.
   */
  async execute(request: AgentRuntimeRequest, context: AgentExecutionContext): Promise<KernelResult> {
    context.signal.throwIfAborted()

    const definition = this.definitionRegistry.resolve(request.agentId)
    const agent = await this.agentFactory.create(definition)

    context.signal.throwIfAborted()

    const toolNames = [...new Set(request.toolNames)]
    const tools = this.toolRegistry.definitionsFor(toolNames)

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
