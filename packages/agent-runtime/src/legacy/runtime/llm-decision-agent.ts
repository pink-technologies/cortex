// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind, LLM, MessageRole, type TextContent } from '@/llm/llm'
import type { Agent, AgentContext, AgentDecision } from '../../agent/models/agent'
import type { AgentDescriptor } from '@/definitions/models/agent-definition/agent-definition'
import { agentDecisionsSchema } from '../schema/agent-decision/agent-decision-schema'
import { LLMModel } from '@/llm'
import { FailedToGenerateDecisionsError } from '../../agent/error/error'

/**
 * Configuration required to instantiate and run an {@link Agent}.
 *
 * [AgentConfiguration] defines the model, prompt, and allowed interactions
 * (skills, capabilities, and delegates) that shape the agent’s behavior.
 * It is typically derived from the agent manifest and used by
 * {@link LLMDecisionAgent} during execution.
 */
export interface AgentConfiguration {
   /**
     * Capability ids (e.g. manifest keys) this agent is associated with for routing or reasoning.
     */
   readonly capabilityIds: readonly string[]
  
  /**
   * Chat model used by {@link LLMDecisionAgent.decide}.
   *
   * This is typically resolved from the application default model, such as
   * `LLM_DEFAULT_MODEL`, unless the agent manifest specifies another model.
   */
  readonly model: LLMModel

  /**
   * Agent identifiers this agent is allowed to delegate to.
   *
   * These identifiers are listed in the decision prompt as available delegates.
   * Omit this value or provide an empty array when the agent cannot delegate.
   */
  readonly delegateAgentIds: readonly string[]

  /**
    * Skill ids this agent may invoke via {@link AgentDecisionType.UseSkill} (enforce in orchestration).
    */
  readonly skills: readonly string[]

  /**
   * System instructions sent to the language model for every decision call.
   *
   * This value is usually loaded from the agent manifest's prompt file and
   * defines the agent's behavior, responsibilities, and boundaries.
   */
  readonly systemPrompt: string
}

/**
 * An {@link Agent} implementation that uses an {@link LLM} to produce
 * structured {@link AgentDecision} values.
 *
 * [LLMDecisionAgent] builds a prompt from the current {@link AgentContext},
 * sends it to the configured language model, and validates the model response
 * against {@link agentDecisionsSchema}.
 */
export class LLMDecisionAgent implements Agent {
  // MARK: - Constructor

  /**
   * Creates a new {@link LLMDecisionAgent}.
   *
   * @param id - Stable identifier used to register and resolve the agent.
   * @param llm - Language model client used to generate decisions.
   * @param configuration - Agent configuration, including the system prompt,
   * model, descriptor, and delegation settings.
   */
  constructor(
    readonly id: string,
    readonly descriptor: AgentDescriptor,
    private readonly llm: LLM,
    private readonly configuration: AgentConfiguration,
  ) {}

  // MARK: - Agent

  /**
   * Decides how to handle the current agent context.
   *
   * @param context - Context available to the agent for the current execution.
   * @returns The decisions produced by the agent.
   */
  async decide(context: AgentContext): Promise<AgentDecision[]> {
    try {
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
          model: this.configuration.model,
          systemPrompt: this.configuration.systemPrompt,
        },
      );

      const contentText = result.content
        .filter(
          (block): block is TextContent => block.type === ContentKind.Text,
        )
        .map((block) => block.text)
        .join('')
        .trim();

      const sanitizedContent = this.sanitizeContent(contentText);
      const raw: unknown = JSON.parse(sanitizedContent);

      return agentDecisionsSchema.parse(raw);
    } catch (error) {
      throw new FailedToGenerateDecisionsError({ cause: error });
    }
  }

  // MARK: - Private methods

  private buildPrompt(context: AgentContext): string {
    return [
      `Execution id: ${context.executionId}`,
      `Conversation history: ${context.conversationHistory?.map((message) => `${message.role}: ${message.content}`).join('\n') || 'none'}`,
      `User message: ${context.message}`,
      `Available skills: ${this.configuration.skills.join(', ') || 'none'}`,
      `Available capabilities: ${this.configuration.capabilityIds.join(', ') || 'none'}`,
      `Available delegates: ${this.configuration.delegateAgentIds?.join(', ') || 'none'}`,
    ].join('\n\n');
  }

  private sanitizeContent(contentText: string): string {
    if (contentText.startsWith('[') || contentText.startsWith('{')) {
      return contentText;
    }

    const match = contentText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);

    if (!match) {
      throw new Error('Expected JSON response from agent model.');
    }

    return match[1].trim();
  }
}
