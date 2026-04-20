// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject } from "@nestjs/common";
import { KernelResult } from "../result/kernel-result";
import { AgentDecisionType } from "@/agents/agent";
import { ExecutionContext } from "@/shared/types/";
import {
  Agent,
  type AgentDecision,
} from "@/agents";

import type { Storage } from "@/infraestructure/storage/storage";
import { STORAGE } from "@/infraestructure/storage";
import { KernelAgentNotFoundError, KernelInvalidDecisionTypeError, SkillDecisionTypeNotSupportedError } from "../error/kernel.error";
import { CapabilityRegistryService } from "@/capabilities/service/registry/ capability-registry.service";

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
   * Creates a new {@link KernelDecisionExecutor}.
   *
   * @param storage - Same {@link STORAGE} as {@link AgentService} (in-memory; not Redis JSON).
   * @param capabilityRegistryService - The capability registry service.
   */
  constructor(
    @Inject(STORAGE)
    private readonly storage: Storage,
    private readonly capabilityRegistryService: CapabilityRegistryService,
  ) { }

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
        const agent = await this.storage.read<Agent>(decision.agentId);

        if (!agent) throw new KernelAgentNotFoundError();

        const nextDecision = await agent.decide({
          executionId: context.executionId,
          message: context.message
        });

        return this.execute(nextDecision, context);
      }

      case AgentDecisionType.Respond: {
        return {
          executionId: context.executionId,
          message: decision.response,
        };
      }

      case AgentDecisionType.UseCapability: {
        const capability = this.capabilityRegistryService.get(decision.capabilityId);
        await capability.execute(decision.input, context);

        return {
          executionId: context.executionId,
          message: decision.userMessage
        };
      }

      case AgentDecisionType.SuggestCapability: {
        return {
          executionId: context.executionId,
          message: decision.message,
          capabilities: decision.capabilities,
        }
      }

      case AgentDecisionType.UseSkill: {
        throw new SkillDecisionTypeNotSupportedError();
      }

      default:
        return {
          executionId: context.executionId,
          message: new KernelInvalidDecisionTypeError(decision).message,
        };
    }
  }
}