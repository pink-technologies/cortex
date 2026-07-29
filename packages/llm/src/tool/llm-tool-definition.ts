// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Declares a function the model may call during a completion.
 *
 * Passed on {@link LLMRequest.tools}. Provider adapters map this shape onto
 * vendor tool / function-calling schemas (for example OpenAI
 * `ChatCompletionTool`). When omitted or empty on the request, tool use is
 * disabled for that call.
 *
 * If the model selects a tool, the response includes {@link ToolUseContent}
 * whose {@link ToolUseContent.name} matches {@link name}. The runtime must be
 * able to execute that name and return {@link ToolResultContent}.
 */
export interface LLMToolDefinition {
  /**
   * Human-readable guidance for when the model should use this tool.
   *
   * Prefer a short, concrete description of purpose and side effects; many
   * providers surface this text directly in the tool schema sent to the model.
   */
  readonly description?: string

  /**
   * Stable tool identifier the model must return when invoking the tool.
   *
   * Must be unique within {@link LLMRequest.tools} and match a runtime
   * executor. Prefer lowercase snake_case or dotted ids consistent with the
   * rest of the catalog.
   */
  readonly name: string

  /**
   * JSON Schema object describing accepted arguments.
   *
   * Typically a draft schema with `type: "object"` and `properties`. Stored as
   * a loose record so adapters can forward it without a schema runtime
   * dependency; callers are responsible for supplying valid schema shapes.
   */
  readonly parameters: Readonly<Record<string, unknown>>
}
