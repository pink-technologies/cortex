// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { MessageRole } from '@/llm/llm';
import { agentDecisionSchema } from '../schema/agent-decision/agent-decision.schema';
import { AgentConfiguration } from '../agent.config';
import type {
  Agent,
  AgentContext,
  AgentDecision,
  AgentDescriptor,
} from '../agent';

/**
 * {@link Agent} whose {@link Agent.decide} calls the {@link LLM} port for one structured
 * {@link AgentDecision} (JSON), then validates it with {@link agentDecisionSchema}.
 *
 * Instantiated by `AgentService` (not a Nest provider); pass a single {@link AgentConfiguration}.
 */
export class PromptDrivenAgent implements Agent {
  // MARK: - Constructor

  constructor(private readonly configuration: AgentConfiguration) { }

  // MARK: - Agent

  /**
   * The id of the agent.
   * 
   * @returns The id of the agent.
   */
  get id(): string {
    return this.configuration.id;
  }

  /**
   * The descriptor of the agent.
   * 
   * @returns The descriptor of the agent.
   */
  get descriptor(): AgentDescriptor {
    return this.configuration.descriptor;
  }

  // MARK: - Instance methods

  /**
   * Decides the next step for this turn: delegate, respond, or invoke a skill.
   *
   * @param context - Current execution id and user message for this decision.
   * @returns A single {@link AgentDecision}; callers interpret and act (loop, respond, execute skill).
   */
  async decide(context: AgentContext): Promise<AgentDecision> {
    const { llm, systemPrompt } = this.configuration;
    const result = await llm.generate({
      systemPrompt,
      messages: [
        {
          role: MessageRole.User,
          content: this.buildPrompt(context),
        },
      ],
      responseFormat: { type: 'json' },
    });

    const raw = JSON.parse(result.content) as unknown;
    return agentDecisionSchema.parse(raw);
  }

  // MARK: - Private methods

  private buildPrompt(context: AgentContext): string {
    const { descriptor, delegateAgentIds } = this.configuration;
    const delegates = delegateAgentIds ?? [];
    const skills = descriptor.allowedSkillIds.join(', ') || 'none';
    const capabilities = descriptor.capabilities.join(', ') || 'none';
    const delegatesLine = delegates.join(', ') || 'none';

    return [
      `Execution id: ${context.executionId}`,
      `User message:\n${context.message}`,
      `Available skills: ${skills}`,
      `Available capabilities: ${capabilities}`,
      `Available delegates: ${delegatesLine}`,
    ].join('\n\n');
  }
}
