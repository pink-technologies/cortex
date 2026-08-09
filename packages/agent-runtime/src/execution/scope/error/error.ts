// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentRuntimeError } from '@/error/error'

/**
 * Thrown when a requested tool is not authorized for the selected agent.
 *
 * Raised during scope resolution when a run requests a tool that none of the
 * agent's authorized capabilities provide. The execution fails closed before
 * any tool definition is exposed to the model.
 */
export class AgentExecutionToolNotAuthorizedError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for unauthorized tool-request errors.
   */
  readonly code = 'AGENT_EXECUTION_TOOL_NOT_AUTHORIZED'

  // MARK: - Constructor

  /**
   * Creates an error describing an unauthorized tool request.
   *
   * @param toolName - Name of the tool that is not authorized for the agent.
   * @param options - Optional error details, including the original cause.
   */
  constructor(toolName: string, options?: ErrorOptions) {
    super(`Tool not authorized for agent execution: ${toolName}`, options)
    this.name = new.target.name
  }
}
