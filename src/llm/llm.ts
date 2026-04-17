// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { InjectionToken } from "@nestjs/common";
import { LLMModel } from "./provider/llm-provider";

/**
 * Nest DI token for the {@link LLM} port (model client: chat/stream via vendor SDKs, {@link LLMResponse} out).
 *
 * Bind to {@link OpenAILLMClient} today; swap in another {@link LLM} implementation
 * (e.g. Anthropic) or a router provider later without changing call sites that inject this token.
 */
export const LLM_TOKEN: InjectionToken<LLM> = Symbol('LLM');

/**
 * Resolved default chat model id when callers do not override (e.g. agents). Wired in
 * {@link LLMModule} from the `LLM_DEFAULT_MODEL` environment variable (required).
 */
export const DEFAULT_LLM_MODEL_TOKEN: InjectionToken<LLMModel> = Symbol('DEFAULT_LLM_MODEL');

/**
 * Discriminants for blocks inside {@link LLMMessage.content} (text, image, tool use, tool result).
 */
export const ContentKind = {
    /** Inline or referenced image block. */
    Image: 'image',
    /** Plain text segment. */
    Text: 'text',
    /** Model-requested tool invocation. */
    ToolUse: 'tool_use',
    /** Tool execution result for the model context. */
    ToolResult: 'tool_result',
} as const;

/** Union of {@link ContentKind} string literals. */
export type ContentKind = (typeof ContentKind)[keyof typeof ContentKind];

/**
 * OpenAI-style chat roles on {@link LLMMessage} and {@link LLMResponse}.
 */
export const MessageRole = {
    /**
     * The assistant role.
     */
    Assistant: 'assistant',

    /**
     * The system role.
     */
    System: 'system',

    /**
     * The tool role.
     */
    Tool: 'tool',

    /**
     * The user role.
     */
    User: 'user',
} as const;

/** Union of literal role strings from {@link MessageRole}. */
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

/**
 * Discriminants for {@link StreamEvent.type} in {@link LLM.stream} sequences.
 *
 * - **`done`** — successful completion of the stream.
 * - **`error`** — terminal failure.
 * - **`text`** / **`tool_use`** / **`tool_result`** — incremental payload chunks when streaming.
 */
export const StreamEventType = {
    /** Terminal stream failure. */
    Error: 'error',

    /** Stream finished successfully. */
    Done: 'done',

    /** Incremental assistant text. */
    Text: 'text',

    /** Streaming tool-call fragment. */
    ToolUse: 'tool_use',

    /** Streaming tool result fragment. */
    ToolResult: 'tool_result',
} as const;

/** Union of {@link StreamEventType} string literals. */
export type StreamEventType = (typeof StreamEventType)[keyof typeof StreamEventType];

/**
 * One turn in the chat transcript passed to {@link LLM.chat} / {@link LLM.stream}.
 */
export interface LLMMessage {
    /**
     * Multimodal body for this turn: text segments, images, model tool calls, or tool results.
     */
    readonly content: Content[];

    /**
     * Who produced this turn (`user`, `assistant`, `system`, or `tool` per provider mapping).
     */
    readonly role: MessageRole;
}

/**
 * Inline image part for a user (or model) message; maps to provider vision APIs after encoding.
 */
export interface ImageContent {
    /** Always {@link ContentKind.Image}. */
    readonly type: typeof ContentKind.Image;

    /**
     * Payload carrier; today only base64 inline bytes (extend with URL or file ids per vendor later).
     */
    readonly source: {
        /** Base64-encoded image bytes (no `data:` URL prefix unless your adapter strips it). */
        readonly data: string;

        /** IANA media type, e.g. `image/png`, `image/jpeg`. */
        readonly mediaType: string;

        /** Encoding discriminator; inline base64. */
        readonly type: 'base64';
    };
}

/** Plain text segment inside {@link LLMMessage.content}. */
export interface TextContent {
    /** UTF-8 text for this block. */
    readonly text: string;

    /** Always {@link ContentKind.Text}. */
    readonly type: typeof ContentKind.Text;
}

/**
 * Model-initiated tool invocation (Anthropic-style block); adapters map to OpenAI `tool_calls` as needed.
 */
export interface ToolUseContent {
    /** Provider tool call id for correlating with {@link ToolResultContent}. */
    readonly id: string;

    /** Parsed JSON arguments for the named tool. */
    readonly input: Record<string, unknown>;

    /** Registered tool name. */
    readonly name: string;

    /** Always {@link ContentKind.ToolUse}. */
    readonly type: typeof ContentKind.ToolUse;
}

/**
 * Outcome of running a tool the model requested; pairs with {@link ToolUseContent} via {@link ToolResultContent.toolUseId}.
 */
export interface ToolResultContent {
    /** Serialized result or error text for the model context. */
    readonly content: string;

    /** When true, adapters may mark the block as an error without throwing. */
    readonly isError?: boolean;

    /** Matches {@link ToolUseContent.id} from the originating tool request. */
    readonly toolUseId: string;

    /** Always {@link ContentKind.ToolResult}. */
    readonly type: typeof ContentKind.ToolResult;
}

/** A single block inside {@link LLMMessage.content}. */
export type Content = TextContent | ToolUseContent | ToolResultContent | ImageContent;

/**
 * Declares a function the model may call for this request (capabilities you expose).
 */
export interface LLMToolDefinition {
    /**
     * The name of the tool definition.
     */
    name: string;

    /**
     * The description of the tool definition.
     */
    description?: string;

    /**
     * The parameters of the tool definition.
     */
    parameters: Record<string, unknown>;
}

/**
 * Token counts returned by the provider for billing and limits (names align with common API fields).
 */
export interface TokenUsage {
    /** Tokens charged on the prompt / context side. */
    readonly inputTokens: number;

    /** Tokens generated in the completion. */
    readonly outputTokens: number;
}

/**
 * Normalized outcome of {@link LLM.chat} (non-streaming).
 */
export interface LLMResponse {
    /**
     * Provider completion id when available (for logs, idempotency, or tracing).
     */
    id: string;

    /**
     * Assistant-side payload: typically {@link TextContent} and/or {@link ToolUseContent} blocks.
     */
    content: Content[];

    /**
     * Model id that produced the reply (may differ from the requested id if the provider normalizes it).
     */
    model: LLMModel;

    /**
     * Provider stop reason string (e.g. `stop`, `length`, `tool_calls`, vendor-specific).
     */
    stopReason: string;

    /**
     * Token usage for this completion.
     */
    usage: TokenUsage;
}

/**
 * Cross-provider options for a single model request (model id, sampling, output shape, tools, etc.).
 * Callers may merge these with other fields on a larger input object; implementations map them to each vendor’s API.
 */
export interface LLMOptions {
    /**
     * Chat model id (provider-specific). When omitted, the client uses its configured default model.
     */
    model: LLMModel;

    /**
     * System-level instructions for this request; usually emitted as a `system` message before
     * the conversational `messages` list.
     */
    systemPrompt?: string;

    /**
     * Sampling temperature when the provider supports it (e.g. OpenAI `temperature`).
     */
    temperature?: number;

    /**
     * Maximum tokens in the completion (e.g. OpenAI `max_tokens`).
     */
    maxOutputTokens?: number;

    /**
     * Per-request client timeout in milliseconds when the adapter supports it.
     */
    timeout?: number;

    /**
     * Tool definitions for this turn (provider function-calling). Pair with `toolChoice` on the
     * full input type where the adapter exposes it.
     */
    tools?: LLMToolDefinition[];
    
    /**
     * Abort signal for the request.
     */
    abortSignal?: AbortSignal;
}

/**
 * One chunk in the {@link LLM.stream} async sequence; interpret via {@link StreamEvent.type}.
 */
export interface StreamEvent {
    /**
     * Event kind; terminal success uses {@link StreamEventType.Done}, failure {@link StreamEventType.Error}.
     */
    readonly type: StreamEventType;

    /**
     * Payload shape depends on `type` (e.g. text delta, tool fragment, error detail).
     */
    readonly data: unknown;
}

/**
 * Hexagonal-style port: domain code depends on this contract; adapters implement it with concrete SDKs
 * (OpenAI, Anthropic, Ollama, local runners, etc.).
 *
 * Callers pass {@link LLMMessage}[] + {@link LLMOptions}; implementations return {@link LLMResponse} or a
 * {@link StreamEvent} sequence.
 */
export interface LLM {
    /**
     * Runs a single chat completion and returns the full result.
     *
     * @param messages - Conversation history and current turn, in order.
     * @param options - Model override, system prompt, sampling, tools, timeout, etc.
     * @returns Normalized {@link LLMResponse} including {@link LLMResponse.content} and {@link LLMResponse.usage}.
     * @throws On non-retryable API or adapter errors.
     */
    chat(messages: LLMMessage[], options: LLMOptions): Promise<LLMResponse>;

    /**
     * Streams a chat completion as an async iterable of {@link StreamEvent}.
     *
     * @param messages - Same as {@link LLM.chat}.
     * @param options - Same as {@link LLM.chat}.
     * @returns Async iterable; on success the last event uses {@link StreamEventType.Done}, on failure {@link StreamEventType.Error}.
     */
    stream(messages: LLMMessage[], options: LLMOptions): AsyncIterable<StreamEvent>;
}
