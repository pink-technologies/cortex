// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { MessageRole } from '@/llm/llm';
import { agentDecisionsSchema } from '../schema/agent-decision/agent-decision.schema';
import { AgentConfiguration } from '../agent.config';
import type {
  Agent,
  AgentContext,
  AgentDecision,
  AgentDescriptor,
} from '../agent';

/**
 * {@link Agent} whose {@link Agent.decide} calls the {@link LLM} port for structured
 * decision JSON (one object or an array), then validates with {@link agentDecisionsSchema}.
 *
 * Instantiated by `AgentService` (not a Nest provider); pass a single {@link AgentConfiguration}.
 */
export class PromptDrivenAgent implements Agent {
  // MARK: - Constructor

  /**
   * Creates a new {@link PromptDrivenAgent}.
   * 
   * @param configuration - The configuration of the agent.
   */
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
   * Decides ordered steps for this turn: delegate, respond, use-skill, etc.
   *
   * @param context - Current execution id and user message for this decision.
   * @returns Non-empty ordered {@link AgentDecision} list for the kernel to run in sequence.
   */
  async decide(context: AgentContext): Promise<AgentDecision[]> {
    const { llm, systemPrompt } = this.configuration;
    const result = await llm.generate({
      systemPrompt,
      messages: [
        {
          role: MessageRole.User,
          content: this.buildPrompt(context),
        },
      ],
    });

    const raw = JSON.parse(result.content) as unknown;
    return agentDecisionsSchema.parse(raw);
  }

  // MARK: - Private methods

  private buildPrompt(context: AgentContext): string {
    const parts = [
      `Execution id: ${context.executionId}`,
      `Conversation history: ${context.conversationHistory?.map(message => `${message.role}: ${message.content}`).join('\n')}`,
      `User message: ${context.message}`,
      `Available skills: ${this.configuration.descriptor.skills.join(', ')}`,
      `Available capabilities: ${this.configuration.descriptor.capabilities.join(', ')}`,
      `Available delegates: ${this.configuration.delegateAgentIds?.join(', ') ?? 'none'}`,
    ];

    return parts.join('\n\n');
  }
}