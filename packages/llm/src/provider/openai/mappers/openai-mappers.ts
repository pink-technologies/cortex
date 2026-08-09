// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import OpenAI from 'openai'
import type { Content } from '../../../content/content'
import { ContentKind } from '../../../content'
import type { ToolUseContent } from '../../../content'
import type { LLMResponse } from '../../../client'
import type { LLMMessage } from '../../../message/llm-message'
import { LLMMessageRole } from '../../../message/llm-message-role'
import { LLMProviderType } from '../../llm-provider-type'
import { LLMStopReason } from '../../../stop-reason/llm-stop-reason'
import type { LLMToolDefinition } from '../../../tool/llm-tool-definition'
import type {
  ChatCompletion,
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources'

import {
  LLMAuthenticationError,
  LLMConnectionError,
  LLMEmptyResponseError,
  LLMError,
  LLMInvalidRequestError,
  LLMMessageRoleNotSupportedError,
  LLMModelNotSupportedError,
  LLMPermissionDeniedError,
  LLMRateLimitError,
  LLMRequestCancelledError,
  LLMResponseDecodingError,
  LLMServiceUnavailableError,
  LLMTimeoutError,
  LLMToolCallNotSupportedError,
  LLMUnknownProviderError,  
} from '../../../error/error'

/**
 * Converts an OpenAI chat completion into its normalized Cortex
 * representation.
 *
 * Text and tool calls are preserved in their original order groups and the
 * provider finish reason is converted into a normalized {@link LLMStopReason}.
 * A content-filtered response may contain no assistant content while still
 * representing a valid provider response.
 *
 * @param chatCompletion - Chat completion returned by OpenAI.
 * @returns The normalized language-model response.
 * @throws {@link LLMEmptyResponseError} when no response choice is available or
 *   the selected choice contains no supported content.
 * @throws {@link LLMResponseDecodingError} when tool-call input cannot be
 *   decoded into a JSON object.
 */
export function mapFromOpenAIChatCompletion(chatCompletion: ChatCompletion): LLMResponse {
  const choice = chatCompletion.choices.at(0)

  if (!choice) {
    throw new LLMEmptyResponseError(
      'The OpenAI response did not contain a completion choice.',
      {
        provider: LLMProviderType.OpenAI,
      },
    )
  }

  const content: Content[] = []
  const message = choice.message
  const stopReason = mapFromOpenAIFinishReason(choice.finish_reason)

  if (message.content !== null && message.content.length > 0) {
    content.push({
      text: message.content,
      type: ContentKind.Text,
    })
  }

  if (message.tool_calls?.length) {
    content.push(...mapFromOpenAIToolCalls(message.tool_calls))
  }

  if (
    content.length === 0 &&
    stopReason !== LLMStopReason.ContentFiltered
  ) {
    throw new LLMEmptyResponseError(
      'The OpenAI response did not contain supported assistant content.',
      {
        provider: LLMProviderType.OpenAI,
      },
    )
  }

  return {
    content,
    model: chatCompletion.model,
    providerResponseId: chatCompletion.id,
    stopReason,
    usage: {
      inputTokens: chatCompletion.usage?.prompt_tokens ?? 0,
      outputTokens: chatCompletion.usage?.completion_tokens ?? 0,
    },
  }
}

/**
 * Normalizes an OpenAI SDK or transport error into a Cortex {@link LLMError}.
 *
 * OpenAI error subclasses are inspected from most specific to most general so
 * connection timeouts are not classified as generic connection failures and
 * provider API errors are not classified as unknown JavaScript errors.
 *
 * Model-not-found responses become {@link LLMModelNotSupportedError} when the
 * provider reports `param = model` or `code = model_not_found`. Other not-found
 * responses become {@link LLMInvalidRequestError}.
 *
 * Existing Cortex {@link LLMError} values are returned unchanged. Provider
 * request identifiers are preserved when the OpenAI SDK exposes `requestID`.
 *
 * @param error - Value thrown or rejected by the OpenAI client.
 * @returns A normalized Cortex LLM error.
 */
export function mapFromOpenAIError(error: unknown): LLMError {
  if (error instanceof LLMError) {
    return error
  }

  if (error instanceof OpenAI.APIUserAbortError) {
    return new LLMRequestCancelledError(
      'The LLM request was cancelled.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      },
    )
  }

  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new LLMTimeoutError(
      'The LLM request timed out.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof OpenAI.APIConnectionError) {
    return new LLMConnectionError(
      'The LLM provider could not be reached.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof OpenAI.AuthenticationError) {
    return new LLMAuthenticationError(
      'Authentication with the LLM provider failed.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof OpenAI.PermissionDeniedError) {
    return new LLMPermissionDeniedError(
      'Permission was denied by the LLM provider.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof OpenAI.BadRequestError) {
    return new LLMInvalidRequestError(
      'The LLM request is invalid.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof OpenAI.UnprocessableEntityError) {
    return new LLMInvalidRequestError(
      'The LLM request could not be processed.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof OpenAI.NotFoundError) {
    const isModelNotFoundError = error.param === 'model' || error.code === 'model_not_found'

    if (isModelNotFoundError) {
      return new LLMModelNotSupportedError(
        'The selected LLM model is not supported.',
        {
          cause: error,
          provider: LLMProviderType.OpenAI,
          requestId: error.requestID ?? undefined,
        }
      )
    }

    return new LLMInvalidRequestError(
      'The requested LLM resource was not found.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof OpenAI.RateLimitError) {
    return new LLMRateLimitError(
      'The LLM provider rate limit has been exceeded.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof OpenAI.InternalServerError) {
    return new LLMServiceUnavailableError(
      'The LLM provider is temporarily unavailable.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof OpenAI.APIError) {
    return new LLMUnknownProviderError(
      'The LLM provider returned an unexpected error.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
        requestId: error.requestID ?? undefined,
      }
    )
  }

  if (error instanceof Error) {
    return new LLMUnknownProviderError(error.message, {
      cause: error,
      provider: LLMProviderType.OpenAI,
    })
  }

  return new LLMUnknownProviderError(
    'An unknown LLM provider error occurred.',
    {
      cause: error,
      provider: LLMProviderType.OpenAI,
    },
  )
}

/**
 * Maps a Cortex transcript into OpenAI chat-completion messages.
 *
 * Message roles are mapped explicitly:
 *
 * - {@link LLMMessageRole.Assistant} accepts text and tool-use blocks.
 * - {@link LLMMessageRole.Tool} accepts tool-result blocks.
 * - {@link LLMMessageRole.User} accepts text and image blocks.
 *
 * Unsupported role and content combinations fail instead of being silently
 * discarded or mapped as user content.
 *
 * @param messages - Ordered conversation turns in Cortex form.
 * @returns OpenAI messages in the same conversation order.
 * @throws {@link LLMMessageRoleNotSupportedError} when a message role is not
 *   supported.
 * @throws {@link LLMInvalidRequestError} when a message contains content that
 *   is not valid for its role.
 */
export function mapToOpenAIMessages(messages: readonly LLMMessage[]): ChatCompletionMessageParam[] {
  const result: ChatCompletionMessageParam[] = []

  for (const message of messages) {
    switch (message.role) {
      case LLMMessageRole.Assistant:
        result.push(mapToOpenAIAssistantMessage(message))
        break

      case LLMMessageRole.Tool:
        result.push(...mapToOpenAIToolMessages(message))
        break

      case LLMMessageRole.User:
        result.push(mapToOpenAIUserMessage(message))
        break

      default:
        throw new LLMMessageRoleNotSupportedError(
          `The LLM message role "${String(message.role)}" is not supported by OpenAI.`,
          {
            provider: LLMProviderType.OpenAI,
          },
        )
    }
  }

  return result
}

/**
 * Builds the complete OpenAI message list for a chat-completion request.
 *
 * The system message is inserted first when {@link systemPrompt} contains
 * non-whitespace content. Conversation messages are then appended using
 * {@link mapToOpenAIMessages}.
 *
 * @param messages - Ordered conversation turns in Cortex form.
 * @param systemPrompt - Optional system instructions for the model.
 * @returns Messages ready for `chat.completions.create`.
 */
export function mapToOpenAIMessageList(
  messages: readonly LLMMessage[],
  systemPrompt: string | undefined,
): ChatCompletionMessageParam[] {
  const result: ChatCompletionMessageParam[] = []

  if (systemPrompt !== undefined && systemPrompt.trim().length > 0) {
    result.push({
      content: systemPrompt,
      role: 'system',
    })
  }

  result.push(...mapToOpenAIMessages(messages))

  return result
}

/**
 * Maps a Cortex {@link LLMToolDefinition} to OpenAI's
 * {@link ChatCompletionTool} representation.
 *
 * @param tool - Tool metadata and JSON Schema for accepted arguments.
 * @returns A tool definition suitable for a chat-completion request.
 */
export function mapToOpenAITool(tool: LLMToolDefinition): ChatCompletionTool {
  return {
    function: {
      description: tool.description,
      name: tool.name,
      parameters: tool.parameters,
    },
    type: 'function',
  }
}

/**
 * Maps a Cortex assistant message into OpenAI's assistant-message shape.
 *
 * Text blocks are concatenated in their original order. Tool-use blocks become
 * OpenAI function tool calls. Any other content kind is rejected because it is
 * not valid for an assistant message.
 *
 * @param message - Assistant message to map.
 * @returns The corresponding OpenAI assistant message.
 * @throws {@link LLMInvalidRequestError} when unsupported or empty content is
 *   provided.
 */
function mapToOpenAIAssistantMessage(message: LLMMessage): ChatCompletionAssistantMessageParam {
  const textParts: string[] = []
  const toolCalls: ChatCompletionMessageToolCall[] = []

  for (const content of message.content) {
    switch (content.type) {
      case ContentKind.Text:
        textParts.push(content.text)
        break

      case ContentKind.ToolUse:
        toolCalls.push({
          function: {
            arguments: JSON.stringify(content.input),
            name: content.name,
          },
          id: content.id,
          type: 'function',
        })
        break

      default:
        throw new LLMInvalidRequestError(
          `Content type "${content.type}" is not supported for the "${LLMMessageRole.Assistant}" message role.`,
          {
            provider: LLMProviderType.OpenAI,
          },
        )
    }
  }

  if (textParts.length === 0 && toolCalls.length === 0) {
    throw new LLMInvalidRequestError(
      'An assistant message must contain text or at least one tool call.',
      {
        provider: LLMProviderType.OpenAI,
      },
    )
  }

  const assistantMessage: ChatCompletionAssistantMessageParam = {
    content: textParts.length > 0 ? textParts.join('') : null,
    role: 'assistant',
  }

  if (toolCalls.length > 0) {
    assistantMessage.tool_calls = toolCalls
  }

  return assistantMessage
}

/**
 * Converts an OpenAI finish reason into its normalized Cortex representation.
 *
 * @param finishReason - Provider-specific completion finish reason.
 * @returns The corresponding provider-independent stop reason.
 */
function mapFromOpenAIFinishReason(finishReason: ChatCompletion.Choice['finish_reason']): LLMStopReason {
  switch (finishReason) {
    case 'stop':
      return LLMStopReason.Completed

    case 'length':
      return LLMStopReason.MaximumOutputTokensReached

    case 'function_call':
    case 'tool_calls':
      return LLMStopReason.ToolUse

    case 'content_filter':
      return LLMStopReason.ContentFiltered

    default:
      return LLMStopReason.Unknown
  }
}

/**
 * Maps a Cortex user message into OpenAI's user-message shape.
 *
 * A single text block uses OpenAI's compact string representation. Mixed text
 * and image content is converted into an ordered content-parts array. Tool-use
 * and tool-result blocks are rejected because they are not valid user content.
 *
 * @param message - User message to map.
 * @returns The corresponding OpenAI user message.
 * @throws {@link LLMInvalidRequestError} when unsupported or empty content is
 *   provided.
 */
function mapToOpenAIUserMessage(message: LLMMessage): ChatCompletionUserMessageParam {
  const onlyContent = message.content.at(0)

  if (
    message.content.length === 1 &&
    onlyContent?.type === ContentKind.Text
  ) {
    return {
      content: onlyContent.text,
      role: 'user',
    }
  }

  type ContentPart =
    | OpenAI.Chat.ChatCompletionContentPartText
    | OpenAI.Chat.ChatCompletionContentPartImage

  const parts: ContentPart[] = []

  for (const content of message.content) {
    switch (content.type) {
      case ContentKind.Text:
        parts.push({
          text: content.text,
          type: 'text',
        })
        break

      case ContentKind.Image:
        parts.push({
          image_url: {
            url: `data:${content.source.mediaType};base64,${content.source.data}`,
          },
          type: 'image_url',
        })
        break

      default:
        throw new LLMInvalidRequestError(
          `Content type "${content.type}" is not supported for the "${LLMMessageRole.User}" message role.`,
          {
            provider: LLMProviderType.OpenAI,
          },
        )
    }
  }

  if (parts.length === 0) {
    throw new LLMInvalidRequestError(
      'A user message must contain text or image content.',
      {
        provider: LLMProviderType.OpenAI,
      },
    )
  }

  return {
    content: parts,
    role: 'user',
  }
}

/**
 * Maps a Cortex tool-result message into OpenAI tool messages.
 *
 * OpenAI represents each tool result as an independent message, so one Cortex
 * message containing multiple tool-result blocks expands into multiple OpenAI
 * messages while preserving their order.
 *
 * @param message - Tool message containing one or more tool-result blocks.
 * @returns The corresponding OpenAI tool messages.
 * @throws {@link LLMInvalidRequestError} when unsupported or empty content is
 *   provided.
 */
function mapToOpenAIToolMessages(message: LLMMessage): ChatCompletionToolMessageParam[] {
  if (message.content.length === 0) {
    throw new LLMInvalidRequestError(
      'A tool message must contain at least one tool result.',
      {
        provider: LLMProviderType.OpenAI,
      },
    )
  }

  return message.content.map((content) => {
    if (content.type !== ContentKind.ToolResult) {
       throw new LLMInvalidRequestError(
        `Content type "${content.type}" is not supported for the "${LLMMessageRole.Tool}" message role.`,
          {
            provider: LLMProviderType.OpenAI,
          },
        )
    }

    return {
      content: content.content,
      role: 'tool',
      tool_call_id: content.toolUseId,
    }
  })
}

/**
 * Converts OpenAI assistant tool calls into Cortex
 * {@link ToolUseContent} blocks.
 *
 * Function and custom tool arguments are decoded as JSON objects. Invalid JSON,
 * arrays, primitives, and `null` values fail with
 * {@link LLMResponseDecodingError}. Unsupported tool-call kinds fail with
 * {@link LLMToolCallNotSupportedError}.
 *
 * @param toolCalls - Tool calls returned by an OpenAI assistant message.
 * @returns Tool-use content blocks in the same order as the provider response.
 */
function mapFromOpenAIToolCalls(toolCalls: readonly ChatCompletionMessageToolCall[]): ToolUseContent[] {
  return toolCalls.map((toolCall) => {
    switch (toolCall.type) {
      case 'custom':
        return {
          id: toolCall.id,
          input: parseOpenAIToolInput(toolCall.custom.input),
          name: toolCall.custom.name,
          type: ContentKind.ToolUse,
        }

      case 'function':
        return {
          id: toolCall.id,
          input: parseOpenAIToolInput(toolCall.function.arguments),
          name: toolCall.function.name,
          type: ContentKind.ToolUse,
        }

      default:
        throw new LLMToolCallNotSupportedError(
          `The OpenAI tool-call type "${String(toolCall)}" is not supported.`,
          {
            provider: LLMProviderType.OpenAI,
          },
        )
    }
  })
}

/**
 * Decodes OpenAI tool-call input into a JSON object.
 *
 * @param input - Stringified JSON input returned by OpenAI.
 * @returns The decoded object.
 * @throws {@link LLMResponseDecodingError} when the value is invalid JSON or is
 *   not a JSON object.
 */
function parseOpenAIToolInput(input: string): Record<string, unknown> {
  try {
    const decoded: unknown = JSON.parse(input)

    if (decoded === null || typeof decoded !== 'object' || Array.isArray(decoded)) {
      throw new TypeError('Tool-call input must be a JSON object.')
    }

    return decoded as Record<string, unknown>
  } catch (error) {
    throw new LLMResponseDecodingError(
      'The OpenAI tool-call input could not be decoded.',
      {
        cause: error,
        provider: LLMProviderType.OpenAI,
      },
    )
  }
}