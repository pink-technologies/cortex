// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind, type ToolResultContent } from '@cortex/llm'
import type { AgentToolExecutionResult } from './agent-tool-execution-result'

/**
 * Maps validated {@link AgentToolExecutionResult} values into
 * {@link ToolResultContent} for the language-model conversation.
 *
 * Used after {@link AgentToolExecutor.execute} succeeds so the kernel can
 * append a tool-result block correlated by {@link AgentToolExecutionResult.toolUseId}.
 * Successful mappings omit {@link ToolResultContent.isError}.
 *
 * Output serialization:
 * - strings are returned as-is
 * - `undefined` becomes the literal string `null`
 * - all other values are JSON-encoded; when encoding yields no string, the
 *   value is coerced with `String(...)`
 */
export class AgentToolResultContentMapper {
  // MARK: - Instance methods

  /**
   * Maps a successful tool execution result into model-facing tool-result
   * content.
   *
   * Preserves {@link AgentToolExecutionResult.toolUseId} so the result pairs
   * with the originating tool request. Sets {@link ToolResultContent.type} to
   * {@link ContentKind.ToolResult}.
   *
   * @param result - Validated result returned by the tool executor.
   * @returns Provider-neutral tool-result content for the conversation.
   */
  map(result: AgentToolExecutionResult): ToolResultContent {
    return {
      content: this.serialize(result.output),
      toolUseId: result.toolUseId,
      type: ContentKind.ToolResult,
    }
  }

  // MARK: - Private methods

  private serialize(output: unknown): string {
    if (typeof output === 'string') {
      return output
    }

    if (output === undefined) {
      return 'null'
    }

    return JSON.stringify(output) ?? String(output)
  }
}
