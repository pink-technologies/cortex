// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Represents the result produced by executing an agent tool.
 *
 * The result preserves the originating tool-use identifier so the kernel can
 * correlate the output with the tool request produced by the language model.
 */
export interface AgentToolExecutionResult {
  /**
   * Output produced by the tool.
   */
  readonly output: unknown

  /**
   * Name of the executed tool.
   */
  readonly toolName: string

  /**
   * Identifier of the originating tool request.
   */
  readonly toolUseId: string
}
