// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common';

import { agentDecisionSchema } from '../schema/agent-decision/agent-decision.schema';
import type {
  Agent,
  AgentContext,
  AgentDecision,
  AgentDescriptor,
} from '../agent';

import type { LLMModel } from '@/llm/provider/llm-provider';
import { type LLM, MessageRole } from '@/llm/llm';
import { LLM_TOKEN } from '@/llm/llm.tokens';

/**
 * {@link Agent} whose {@link Agent.decide} call asks the injected {@link LLM} for one structured
 * {@link AgentDecision} (JSON), then validates it with {@link agentDecisionSchema}.
 *
 * Injects {@link LLM} (vendor-agnostic port), not a concrete SDK — see Nest `di-prefer-constructor-injection`.
 */
@Injectable()
export class PromptDrivenAgent implements Agent {
  // MARK: - Constructor

  /**
   * Creates a new {@link PromptDrivenAgent}.
   *
   * @param id - The id of the agent.
   * @param descriptor - The descriptor of the agent.
   * @param llm - The llm to use.
   * @param model - The model to use.
   * @param delegateAgentIds - The ids of the agents this agent may delegate to.
   */
  constructor(
    readonly id: string,
    readonly descriptor: AgentDescriptor,
    private readonly prompt: string,
    @Inject(LLM_TOKEN)
    private readonly llm: LLM,
    private readonly model: LLMModel,
    private readonly delegateAgentIds: readonly string[] = [],
  ) { }
  systemPrompt?: string | undefined;

  // MARK: - Instance methods

  /**
   * Decides the next step for this turn: delegate, respond, or invoke a skill.
   *
   * @param context - Current execution id and user message for this decision.
   * @returns A single {@link AgentDecision}; callers interpret and act (loop, respond, execute skill).
   */
  async decide(context: AgentContext): Promise<AgentDecision> {
    const result = await this.llm.generate({
      model: this.model,
      systemPrompt: this.prompt,
      messages: [
        {
          role: MessageRole.User,
          content: this.buildUserPrompt(context),
        },
      ],
      responseFormat: { type: 'json' },
    });

    const raw = JSON.parse(result.content) as unknown;
    return agentDecisionSchema.parse(raw);
  }

  // MARK: - Private methods

  private buildUserPrompt(context: AgentContext): string {
    const skills = this.descriptor.allowedSkillIds.join(', ') || 'none';
    const capabilities = this.descriptor.capabilities.join(', ') || 'none';
    const delegates = this.delegateAgentIds.join(', ') || 'none';

    return [
      `Execution id: ${context.executionId}`,
      `User message:\n${context.message}`,
      `Available skills: ${skills}`,
      `Available capabilities: ${capabilities}`,
      `Available delegates: ${delegates}`,
    ].join('\n\n');
  }
}
