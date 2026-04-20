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
import { CapabilityRegistryService } from "@/capabilities/service/registry/capability-registry.service.ts";
import { SkillRegistryService } from "@/skills/service/registry/skill-registry.service";

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
   * @param decisions - Output of {@link Agent.decide} or a follow-up after delegation.
   * @param context - Shared execution scope for this kernel run.
   * @returns Terminal {@link KernelResult} once a **respond** path is taken (or an error is thrown).
   */
  execute(decisions: AgentDecision[], context: ExecutionContext): Promise<KernelResult>;
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
    private readonly skillRegistryService: SkillRegistryService,
  ) { }

  // MARK: - DecisionExecutor

  /**
    * Executes one decision step; may recurse when the decision is **delegate**.
    *
    * @param decision - Output of {@link Agent.decide} or a follow-up after delegation.
    * @param context - Shared execution scope for this kernel run.
    * @returns Terminal {@link KernelResult} once a **respond** path is taken (or an error is thrown).
    */
  async execute(decisions: AgentDecision[], context: ExecutionContext): Promise<KernelResult> {
    let message = '';

    for (const decision of decisions) {

      switch (decision.type) {
        case AgentDecisionType.Delegate: {
          const agent = await this.storage.read<Agent>(decision.agentId);

          if (!agent) throw new KernelAgentNotFoundError();

          const nextDecisions = await agent.decide({
            executionId: context.executionId,
            message: context.message
          });

          const result = await this.execute(nextDecisions, context);
          message += result.message + '\n';
          break;
        }

        case AgentDecisionType.Respond: {
          message += decision.response + '\n';
          return {
            executionId: context.executionId,
            message: message,
          };
        }

        case AgentDecisionType.UseCapability: {
          const capability = this.capabilityRegistryService.get(decision.capabilityId);
          await capability.execute(decision.input, context);

          message += `${decision.userMessage}\n`;
          break;
        }

        case AgentDecisionType.SuggestCapability: {
          return {
            executionId: context.executionId,
            message: decision.message,
            capabilities: decision.capabilities,
          }
        }

        case AgentDecisionType.SuggestSkill: {
          return {
            executionId: context.executionId,
            message: decision.message,
            skills: decision.skills,
          }
        }

        case AgentDecisionType.SuggestOptions: {
          return {
            executionId: context.executionId,
            message: decision.message,
            capabilities: decision.capabilities,
            skills: decision.skills,
          }
        }

        case AgentDecisionType.UseSkill: {
          const skill = this.skillRegistryService.get(decision.skillId);
          const result = await skill.execute(decision.input, context);
          message += `\n${result}\n`;
          break;
        }

        default: {
          return {
            executionId: context.executionId,
            message: new KernelInvalidDecisionTypeError(decision).message,
          };
        }
      }
    }

    return {
      executionId: context.executionId,
      message: message,
    };
  }
}