// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind, MessageRole, type LLMMessage, type TextContent } from '@/llm/llm';
import type { ConversationMessage } from '@/shared/types/input/execution-input';
import { agentDecisionsSchema } from '../schema/agent-decision/agent-decision.schema';
import type {
  Agent,
  AgentConfiguration,
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

  /**
   * Creates a prompt-driven agent backed by the given static wiring.
   *
   * @param configuration - {@link AgentConfiguration}: `id`, {@link AgentDescriptor}, `model`, `systemPrompt`,
   *   {@link LLM} port, and optional `delegateAgentIds`. Used for {@link Agent.id},
   *   {@link Agent.descriptor}, and {@link Agent.decide} (LLM call + prompt assembly).
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

  /**
   * Decides the next step for this turn: delegate, respond, or invoke a skill.
   *
   * @param context - Current execution id and user message for this decision.
   * @returns A single {@link AgentDecision}; callers interpret and act (loop, respond, execute skill).
   */
  async decide(context: AgentContext): Promise<AgentDecision[]> {
    const { llm, systemPrompt, model } = this.configuration;

    const fullSystemPrompt = this.buildSystemPrompt(systemPrompt, context);
    const messages = this.buildMessages(context);

    const result = await llm.chat(messages, {
      model,
      systemPrompt: fullSystemPrompt,
      responseFormat: 'json_object',
    });

    const assistantText = result.content
      .filter((message): message is TextContent => message.type === ContentKind.Text)
      .map((message) => message.text)
      .join('')

    const cleaned = assistantText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const raw = JSON.parse(cleaned);
    return agentDecisionsSchema.parse(raw);
  }

  // MARK: - Private methods

  private buildSystemPrompt(basePrompt: string | undefined, context: AgentContext): string {
    const capabilities = context.availableCapabilities ?? [];
    const capabilityDefinitions = capabilities.length === 0 ? 'none' : JSON.stringify(capabilities, null, 2);

    const sections = [
      basePrompt?.trim() ?? '',
      '',
      `Available skills: ${this.configuration.descriptor.skills.join(', ') || 'none'}`,
      `Available capabilities: ${this.configuration.descriptor.capabilities.join(', ') || 'none'}`,
      `Available capabilities definitions: ${capabilityDefinitions}`,
      `Available delegates: ${this.configuration.delegateAgentIds?.join(', ') || 'none'}`,
      '',
      `Execution id: ${context.executionId}`,
    ];

    return sections.join('\n');
  }

  private buildMessages(context: AgentContext): LLMMessage[] {
    const history = context.conversationHistory ?? [];
    const messages: LLMMessage[] = history.map((entry) => ({
      role: this.toLLMRole(entry.role),
      content: [
        {
          type: ContentKind.Text,
          text: entry.content
        }],
    }));

    const last = messages[messages.length - 1];

    if (!last || last.role !== MessageRole.User) {
      messages.push({
        role: MessageRole.User,
        content: [{ type: ContentKind.Text, text: context.message }],
      });
    }

    return messages;
  }

  private toLLMRole(role: ConversationMessage['role']): MessageRole {
    switch (role) {
      case MessageRole.User:
        return MessageRole.User;

      case MessageRole.Assistant:
        return MessageRole.Assistant;

      case MessageRole.System:
        return MessageRole.System;

      case MessageRole.Tool:
        return MessageRole.Tool;

      default:
        return MessageRole.User;
    }
  }
}