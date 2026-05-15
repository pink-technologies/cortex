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
import { CapabilityRegistryService } from "@/capabilities/service/registry/capability-registry.service";
import { SkillRegistryService } from "@/skills/service/registry/skill-registry.service";
import { ConversationMessage } from "@/shared/types/input/execution-input";
import { KernelAgentNotFoundError, KernelInvalidDecisionTypeError } from "../error/kernel.error";
import { CapabilityDescriptionResolverService } from "@/capabilities";

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
   * @param capabilityDescriptionResolver - Resolves live capability descriptions
   *   for the acting agent so re-entrant {@link Agent.decide} calls see the
   *   same dynamic contract as the kernel's initial call.
   * @param skillRegistryService - The skill registry service.
   */
  constructor(
    @Inject(STORAGE)
    private readonly storage: Storage,
    private readonly capabilityRegistryService: CapabilityRegistryService,
    private readonly capabilityDescriptionResolver: CapabilityDescriptionResolverService,
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

          const delegateContext: ExecutionContext = {
            ...context,
            agent,
          };

          const availableCapabilities =
            await this.capabilityDescriptionResolver.resolve(
              agent.descriptor.capabilities,
              delegateContext,
            );

          const nextDecisions = await agent.decide({
            executionId: context.executionId,
            message: context.message,
            conversationHistory: context.conversationHistory,
            availableCapabilities,
          });

          const result = await this.execute(nextDecisions, delegateContext);
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

        case AgentDecisionType.UseCapability: {

          const capability = this.capabilityRegistryService.get(decision.capabilityId);
          const result = await capability.execute(decision.input, context);

          const callEntry: ConversationMessage = {
            role: 'assistant',
            content: JSON.stringify({
              type: 'use-capability',
              capabilityId: decision.capabilityId,
              input: decision.input,
            }),
          };

          const resultEntry: ConversationMessage = {
            role: 'assistant',
            content:
              `[capability-result] capabilityId=${decision.capabilityId} ` +
              `result=${JSON.stringify(result)}`,
          };

          const synthesizeEntry: ConversationMessage = {
            role: 'user',
            content:
              'The previous [capability-result] above contains the data ' +
              'needed to answer my original question. Synthesize it into a ' +
              'final `respond` decision now. Do NOT call the same capability ' +
              'with the same input again.',
          };

          const updatedHistory: ConversationMessage[] = [
            ...(context.conversationHistory ?? []),
            callEntry,
            resultEntry,
            synthesizeEntry,
          ];

          const nextContext: ExecutionContext = {
            ...context,
            conversationHistory: updatedHistory,
          };

          const availableCapabilities =
            await this.capabilityDescriptionResolver.resolve(
              context.agent.descriptor.capabilities,
              nextContext,
            );

          const nextDecisions = await context.agent.decide({
            executionId: context.executionId,
            message: context.message,
            conversationHistory: updatedHistory,
            availableCapabilities,
          });

          return await this.execute(nextDecisions, nextContext);
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
      message,
    };
  }
}