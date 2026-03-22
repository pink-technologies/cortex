// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  AGENT_REGISTRY,
  type AgentContext,
  type AgentRegistry,
} from '@/agents';
import {
  DECISION_EXECUTOR,
  type DecisionExecutor,
} from './executor/desicion-executor';
import { KernelResult } from './result/kernel-result';
import { ExecutionInput } from '@/shared/types';

const DEFAULT_AGENT_ID = 'main-assistant';

/**
 * Kernel “brain” service: single entry for processing {@link KernelInput}.
 *
 * Responsibilities:
 * - resolve the agent ID (from intent or default)
 * - select the origin adapter via {@link KernelOriginAdapterRegistry}
 * - delegate execution to the adapter (chat, webhook, etc.)
 */
@Injectable()
export class Kernel {
  // MARK: - Constructor

  /**
   * Creates a new {@link Kernel}.
   *
   * @param agentRegistry - Registry used to resolve the main assistant agent.
   * @param decisionExecutor - The decision executor for the kernel.
   */
  constructor(
    @Inject(AGENT_REGISTRY)
    private readonly agentRegistry: AgentRegistry,
    @Inject(DECISION_EXECUTOR)
    private readonly decisionExecutor: DecisionExecutor,
  ) {}

  // MARK: - Instance methods

  async process(input: ExecutionInput): Promise<KernelResult> {
    const executionId = randomUUID();
    const context: AgentContext = {
      message: input.message,
      executionId,
    };

    const agent = this.agentRegistry.get(DEFAULT_AGENT_ID);

    if (!agent) throw new Error('Main agent not found');

    const decision = await agent.decide(context);

    return await this.decisionExecutor.execute(decision, context);
  }
}
