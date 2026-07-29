// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentDefinition } from '../../definition'
import type { AgentExecutionContext } from '../../execution/agent-execution-context'
import type { AgentTurn } from './agent-turn'
import type { AgentTurnRequest } from './agent-turn-request'

/**
 * Represents an executable agent.
 *
 * An agent produces one response turn for the current conversation. It does
 * not execute tools, manage conversation state, enforce execution limits, or
 * control the complete execution lifecycle. Those responsibilities belong to
 * the agent kernel.
 *
 * @typeParam Context - Runtime context required by the agent execution.
 */
export interface Agent<Context extends AgentExecutionContext = AgentExecutionContext> {
  /**
   * Static definition used to configure the agent.
   *
   * The definition contains the agent descriptor, language-model settings,
   * execution limits, and safety policy loaded from its manifest.
   */
  readonly definition: AgentDefinition

  /**
   * Stable identifier used to register and resolve the agent.
   *
   * This value should match `definition.id`.
   */
  readonly id: string

  /**
   * Produces the next turn for the current conversation.
   *
   * The returned turn may contain regular text, tool requests, or both. The
   * kernel is responsible for interpreting the turn, executing authorized
   * tools, appending their results to the conversation, and requesting another
   * turn when necessary.
   *
   * @param request - Conversation history and tools available for this turn.
   * @param context - Runtime information associated with the execution.
   * @returns The next turn produced by the agent.
   */
  nextTurn(request: AgentTurnRequest, context: Context): Promise<AgentTurn>
}