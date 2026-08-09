// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Defines the runtime limits applied whenever an agent is executed.
 *
 * These values come from the agent manifest and are enforced by the agent
 * kernel during execution.
 */
export interface AgentExecutionDefinition {
  /**
   * Maximum number of LLM iterations allowed before execution is stopped.
   *
   * An iteration represents one request to the language model and its
   * corresponding response.
   */
  readonly maximumIterations: number

  /**
   * Maximum total duration allowed for the agent execution, in milliseconds.
   *
   * This limit covers the complete execution, including LLM requests and tool
   * calls.
   */
  readonly timeoutMilliseconds: number
}