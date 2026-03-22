// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AGENT_REGISTRY, type AgentDecision, type AgentRegistry } from "@/agents";
import { Inject } from "@nestjs/common";
import { KernelResult } from "../result/kernel-result";
import { AgentDecisionType } from "@/agents/agent";
import { ExecutionContext } from "@/shared/types/";

/**
 * Nest DI token for {@link DecisionExecutor}.
 *
 * Bind to {@link KernelDecisionExecutor} (or a test double) where the kernel needs to
 * materialize {@link AgentDecision} into a {@link KernelResult}.
 */
export const DECISION_EXECUTOR = Symbol('DECISION_EXECUTOR');

/**
 * Turns an {@link AgentDecision} into a {@link KernelResult} using the current
 * {@link ExecutionContext} (same `executionId` / `message` for the whole chain).
 *
 * Implementations interpret **delegate** (recursive agent hops), **respond** (terminal text),
 * and **use-skill** (tool invocation) according to product rules.
 */
export interface DecisionExecutor {
    /**
     * Executes one decision step; may recurse when the decision is **delegate**.
     *
     * @param decision - Output of {@link Agent.decide} or a follow-up after delegation.
     * @param context - Shared execution scope for this kernel run.
     * @returns Terminal {@link KernelResult} once a **respond** path is taken (or an error is thrown).
     */
    execute(decision: AgentDecision, context: ExecutionContext): Promise<KernelResult>;
}

/**
 * Default {@link DecisionExecutor}: resolves **delegate** via {@link AgentRegistry},
 * **respond** as the final user-visible message, and rejects unsupported branches.
 *
 * **Delegate** loads the target {@link Agent}, calls {@link Agent.decide}, and recurses
 * until a non-delegate decision is produced (watch stack depth / cycles at the orchestration layer).
 */
export class KernelDecisionExecutor implements DecisionExecutor {

    // MARK: - Constructor

    /**
     * @param agentRegistry - Registry used to resolve {@link Agent} by id for **delegate** decisions.
     */
    constructor(
        @Inject(AGENT_REGISTRY)
        private readonly agentRegistry: AgentRegistry
    ) {}

    // MARK: - DecisionExecutor

   /**
     * Executes one decision step; may recurse when the decision is **delegate**.
     *
     * @param decision - Output of {@link Agent.decide} or a follow-up after delegation.
     * @param context - Shared execution scope for this kernel run.
     * @returns Terminal {@link KernelResult} once a **respond** path is taken (or an error is thrown).
     */
    async execute(decision: AgentDecision, context: ExecutionContext): Promise<KernelResult> {
        // TODO: Real implementation this is just a placeholder
        switch (decision.type) {
            case AgentDecisionType.Delegate: {
                const agent = this.agentRegistry.get(decision.agentId);
  
                if (!agent) throw new Error('Agent not found');
        
                const nextDecision = await agent.decide({
                  executionId: context.executionId,
                  message: context.message,
                });
        
                return this.execute(nextDecision, context);
              }

            case AgentDecisionType.Respond:
              return {
                executionId: context.executionId,
                message: decision.response,
              };
      
            case AgentDecisionType.UseSkill: {
                throw new Error('UseSkill decision type is not supported yet');
            }

            default:
                return {
                    executionId: context.executionId,
                    message: 'Invalid decision type',
                };
        }
    }
}