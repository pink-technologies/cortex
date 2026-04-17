// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { LLMNoChoicesError, LLMToolCallNotSupportedError } from "@/llm/error/error";
import { Content, ContentKind, LLMMessage, LLMResponse, LLMToolDefinition, MessageRole, TextContent, ToolUseContent } from "@/llm/llm"
import OpenAI from "openai";
import { 
  ChatCompletion, 
  ChatCompletionAssistantMessageParam, 
  ChatCompletionMessageParam, 
  ChatCompletionMessageToolCall, 
  ChatCompletionTool, 
  ChatCompletionToolMessageParam, 
  ChatCompletionUserMessageParam
} from "openai/resources"

/**
 * Converts a non-streaming OpenAI {@link ChatCompletion} into Cortex {@link LLMResponse}.
 *
 * **Choice handling** — Uses `choices[0]` only. Throws {@link LLMNoChoicesError} when the array is empty.
 *
 * **Content** — Builds an ordered {@link Content} list:
 * - When `message.content` is present, appends one {@link TextContent} block (assistant text).
 * - When `message.tool_calls` is present, appends {@link ToolUseContent} blocks via {@link mapToToolUseContent}
 *   (`function` tools parse `function.arguments` as JSON; `custom` tools parse `custom.input`).
 *
 * **Usage** — Copies `prompt_tokens` / `completion_tokens` into {@link LLMResponse.usage} as
 * `inputTokens` / `outputTokens` (zeros when `usage` is absent).
 *
 * @param chatCompletion - Result of `chat.completions.create` with `stream: false`.
 * @returns Normalized assistant payload; `content` may be empty if the model returned neither text nor tools.
 * @throws {@link LLMNoChoicesError} When `choices` is empty.
 */
export function mapFromOpenAIChatCompletion(chatCompletion: ChatCompletion): LLMResponse {
  if (chatCompletion.choices.length === 0) throw new LLMNoChoicesError();

  const choice = chatCompletion.choices[0]
  const content: Content[] = []
  const message = choice.message

  if (message.content !== null && message.content !== undefined) {
    const textBlock: TextContent = { type: ContentKind.Text, text: message.content }
    content.push(textBlock)
  }

  if (message.tool_calls !== null && message.tool_calls !== undefined) {
    const toolUseContents = mapToToolUseContent(message.tool_calls)
    
    content.push(...toolUseContents)
  }

  return {
    id: chatCompletion.id,
    content,
    model: chatCompletion.model,
    stopReason: choice.finish_reason ?? 'stop',
    usage: {
      inputTokens: chatCompletion.usage?.prompt_tokens ?? 0,
      outputTokens: chatCompletion.usage?.completion_tokens ?? 0,
    },
  }
}

/**
 * Maps a Cortex transcript {@link LLMMessage} list into OpenAI {@link ChatCompletionMessageParam} messages
 * (roles `assistant`, `user`, and `tool`). Does **not** prepend a `system` message — use
 * {@link mapToOpenAIMessageList} when a system prompt is required.
 *
 * **Assistant** — Delegates to {@link mapToOpenAIAssistantMessage} (text + optional `tool_calls`).
 *
 * **User with tool results** — When any block is {@link ContentKind.ToolResult}, splits the turn:
 * - If there are non–tool-result blocks (e.g. text), emits one **user** message from those parts via
 *   {@link mapToOpenAIUserMessage}.
 * - Then emits one OpenAI **`tool`** message per {@link ContentKind.ToolResult}, with `tool_call_id` and
 *   string `content` for the model context.
 *
 * **User without tool results** — A single **user** message via {@link mapToOpenAIUserMessage}.
 *
 * @param messages - Ordered conversation turns in Cortex form (typically user/assistant alternation, plus
 *   tool results where the model had requested tools).
 * @returns Flat list suitable for `chat.completions.create` `messages` (excluding system; order preserved).
 */
export function mapToOpenAIMessages(messages: LLMMessage[]): ChatCompletionMessageParam[] {
    const result: ChatCompletionMessageParam[] = []
  
    for (const message of messages) {
      if (message.role === MessageRole.Assistant) {
        const openAIMessage = mapToOpenAIAssistantMessage(message)
        result.push(openAIMessage)

        continue
      }

      const hasToolResults = message.content.some((content) => content.type === ContentKind.ToolResult)

      if (hasToolResults) {
        const nonToolContents = message.content.filter((content) => content.type !== ContentKind.ToolResult)

        if (nonToolContents.length > 0) {
          const message = { content: nonToolContents, role: MessageRole.User }
          const openAIMessage = mapToOpenAIUserMessage(message)

          result.push(openAIMessage)
        }

        for (const content of message.content) {
          if (content.type !== ContentKind.ToolResult) continue
            
          const toolMsg: ChatCompletionToolMessageParam = {
            role: 'tool',
            tool_call_id: content.toolUseId,
            content: content.content,
          }

          result.push(toolMsg)
        }
      } else {
        const openAIMessage = mapToOpenAIUserMessage(message)

        result.push(openAIMessage)
      }
    }
  
    return result
}  

/**
 * Builds the full OpenAI chat message list for a completion request: optional **system** message
 * first (when `systemPrompt` is non-empty), then all **user / assistant / tool** messages from
 * {@link mapToOpenAIMessages}.
 *
 * @param messages - Conversation turns in {@link LLMMessage} form (same contract as {@link mapToOpenAIMessages}).
 * @param systemPrompt - Optional system instructions; omitted from the list when `undefined` or empty.
 * @returns OpenAI {@link ChatCompletionMessageParam} array ready for `chat.completions.create`.
 */
export function mapToOpenAIMessageList(messages: LLMMessage[], systemPrompt: string | undefined): ChatCompletionMessageParam[] {
    const result: ChatCompletionMessageParam[] = []
  
    if (systemPrompt !== undefined && systemPrompt.length > 0) {
      result.push({ role: 'system', content: systemPrompt })
    }
  
    result.push(...mapToOpenAIMessages(messages))
    return result
}

/**
 * Maps a Cortex {@link LLMToolDefinition} to OpenAI’s {@link ChatCompletionTool} shape
 * (`type: 'function'` with `function.name`, `description`, and JSON Schema `parameters`).
 *
 * @param tool - Tool metadata and JSON Schema for arguments.
 * @returns A value suitable for the `tools` array on chat completion create calls.
 */
export function mapToOpenAITool(tool: LLMToolDefinition): ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }
}

/**
 * Maps a Cortex assistant {@link LLMMessage} into OpenAI’s {@link ChatCompletionAssistantMessageParam}.
 *
 * **Text** — Collects every {@link ContentKind.Text} block, concatenates in order, and sets `content`
 * to that string. When there is no text, `content` is `null` (valid for tool-only assistant turns).
 *
 * **Tool calls** — Each {@link ContentKind.ToolUse} becomes a `function`-style entry in `tool_calls`:
 * `name` from {@link ToolUseContent.name}, `arguments` from {@link JSON.stringify} of
 * {@link ToolUseContent.input} (OpenAI expects a JSON string).
 *
 * **Other blocks** — Non-text, non-tool-use segments in `message.content` are skipped (this path does
 * not map images or tool results; those belong on user/tool roles upstream).
 *
 * @param message - Assistant turn with {@link LLMMessage.content} blocks (typically text and/or tool use).
 * @returns An OpenAI `assistant` message; `tool_calls` is set only when at least one tool-use block exists.
 */
function mapToOpenAIAssistantMessage(message: LLMMessage): ChatCompletionAssistantMessageParam {
  const textParts: string[] = []
  const toolCalls: ChatCompletionMessageToolCall[] = []

  for (const content of message.content) {
    if (content.type === ContentKind.ToolUse) {
      const toolCall: ChatCompletionMessageToolCall = {
        id: content.id,
        type: 'function',
        function: {
          name: content.name,
          arguments: JSON.stringify(content.input),
        },
      }

      toolCalls.push(toolCall)
      continue
    }

    if (content.type === ContentKind.Text) {
      textParts.push(content.text)
    }
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
 * Maps a Cortex user {@link LLMMessage} into OpenAI’s {@link ChatCompletionUserMessageParam}.
 *
 * **Single text** — When `content` is exactly one {@link ContentKind.Text} block, returns the compact
 * form `{ role: 'user', content: string }` (no array wrapper).
 *
 * **Multimodal** — Otherwise builds a `content` array of parts: each {@link ContentKind.Text} becomes
 * `{ type: 'text', text }`; each {@link ContentKind.Image} becomes an `image_url` part whose URL is a
 * `data:<mediaType>;base64,<data>` string from {@link ImageContent.source}.
 *
 * **Omitted blocks** — Tool-use and tool-result segments are not mapped here (they are handled on
 * assistant / `role: 'tool'` messages). Any other block kinds are skipped.
 *
 * @param message - User turn; may be plain text or mixed text + images.
 * @returns OpenAI `user` message in string or parts-array form.
 */
function mapToOpenAIUserMessage(message: LLMMessage): ChatCompletionUserMessageParam {
  if (message.content.length === 1 && message.content[0]?.type === ContentKind.Text) {
    return { role: 'user', content: message.content[0].text }
  }

  const parts: ContentPart[] = []

  type ContentPart = OpenAI.Chat.ChatCompletionContentPartText | OpenAI.Chat.ChatCompletionContentPartImage

  for (const content of message.content) {
    if (content.type === ContentKind.Text) {
      parts.push({ type: 'text', text: content.text })
      continue
    }
    
    if (content.type === ContentKind.Image) {
      parts.push({
        type: 'image_url',
        image_url: {
          url: `data:${content.source.mediaType};base64,${content.source.data}`,
        },
      })
    }    
  }

  return { content: parts, role: 'user'}
}

/**
 * Converts OpenAI assistant `tool_calls` from a completion into Cortex {@link ToolUseContent} blocks.
 *
 * **`function` tools** — Reads `function.name` and parses `function.arguments` (JSON string) into
 * {@link ToolUseContent.input}. If the model emits invalid JSON, `input` is `{}`.
 *
 * **`custom` tools** — Parses `custom.input` (string) as JSON and uses `custom.name` as the tool name.
 *
 * **Unsupported** — Any other `toolCall.type` throws {@link LLMToolCallNotSupportedError}.
 *
 * @param toolCalls - Non-null `message.tool_calls` from {@link ChatCompletion}.
 * @returns One {@link ToolUseContent} per call, in the same order as `toolCalls`.
 */
function mapToToolUseContent(toolCalls: ChatCompletionMessageToolCall[]): ToolUseContent[] {
    return toolCalls.map((toolCall) => {
      switch (toolCall.type) {
        case 'custom':
          return {
            id: toolCall.id,
            input: JSON.parse(toolCall.custom.input) as Record<string, unknown>,
            name: toolCall.custom.name,
            type: ContentKind.ToolUse,
          }
  
        case 'function':
          try {          
            return {
              id: toolCall.id,
              input: JSON.parse(toolCall.function.arguments) as Record<string, unknown>,
              name: toolCall.function.name,
              type: ContentKind.ToolUse,
            }            
          } catch {
            throw new LLMToolCallNotSupportedError();
          }
        default:
            throw new LLMToolCallNotSupportedError();
       }
    })
}