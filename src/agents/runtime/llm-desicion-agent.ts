// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind, LLM, MessageRole, type TextContent } from '@/llm/llm';
import { agentDecisionsSchema } from '../schema/agent-decision/agent-decision.schema';
import type {
  Agent,
  AgentDefinition,
  AgentConfiguration,
  AgentContext,
  AgentDecision,
  AgentDescriptor,
} from '../agent/agent';

/**
 * {@link AgentDefinition} whose {@link AgentDefinition.decide} calls the {@link LLM} port for one structured
 * {@link AgentDecision} (JSON), then validates it with {@link agentDecisionSchema}.
 *
 * Instantiated by `AgentService` (not a Nest provider); pass a single {@link AgentConfiguration}.
 */
export class PromptDrivenAgent implements Agent {
  // MARK: - Constructor

  /**
   * Creates a prompt-driven agent backed by the given static wiring.
   *
   * @param id - The id of the agent.
   * @param llm - {@link LLM} port used by {@link PromptDrivenAgent.decide} for the structured JSON {@link AgentDecision} call (e.g. OpenAI-backed client).
   * @param configuration - {@link AgentConfiguration}: `id`, {@link AgentDescriptor}, `model`, `systemPrompt`,   
   *   {@link AgentDefinition.descriptor}, and {@link AgentDefinition.decide} (LLM call + prompt assembly).
   */
  constructor(readonly id: string, private readonly llm: LLM, private readonly configuration: AgentConfiguration) {}

  // MARK: - Agent

  /**
   * The descriptor of the agent.
   * 
   * @returns The descriptor of the agent.
   */
  get descriptor(): AgentDescriptor {
    return this.configuration.descriptor;
  }

  /**
   * Decides the next step for this turn: delegate, respond, or invoke a skill.
   *
   * @param context - Current execution id and user message for this decision.
   * @returns A single {@link AgentDecision}; callers interpret and act (loop, respond, execute skill).
   */
  async decide(context: AgentContext): Promise<AgentDecision[]> {
    const { systemPrompt, model } = this.configuration;
    const result = await this.llm.chat(
      [
        {
          role: MessageRole.User,
          content: [
            {
              type: ContentKind.Text,
              text: this.buildPrompt(context),
            },
          ],
        },
      ],
      {
        model,
        systemPrompt,
      },
    );

    const assistantText = result.content
      .filter((block): block is TextContent => block.type === ContentKind.Text)
      .map((block) => block.text)
      .join('')
      .replace(/```json|```/g, '')
      .trim();

    const raw = JSON.parse(assistantText) as unknown;
    return agentDecisionsSchema.parse(raw);
  }

  // MARK: - Private methods

  private buildPrompt(context: AgentContext): string {
    const parts = [
      `Execution id: ${context.executionId}`,
      `Conversation history: ${context.conversationHistory?.map(message => `${message.role}: ${message.content}`).join('\n') || 'none'}`,
      `User message: ${context.message}`,
      `Available skills: ${this.configuration.descriptor.skills.join(', ') || 'none'}`,
      `Available capabilities: ${this.configuration.descriptor.capabilities.join(', ') || 'none'}`,
      `Available delegates: ${this.configuration.delegateAgentIds?.join(', ') || 'none'}`,
    ];

    return parts.join('\n\n');
  }
}