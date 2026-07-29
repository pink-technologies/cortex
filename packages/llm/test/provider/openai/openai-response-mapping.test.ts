// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ChatCompletion } from 'openai/resources'
import { ContentKind } from '../../../src/content'
import { LLMEmptyResponseError, LLMResponseDecodingError, LLMToolCallNotSupportedError } from '../../../src/error/error'
import { LLMStopReason } from '../../../src/stop-reason/llm-stop-reason'
import { mapFromOpenAIChatCompletion } from '../../../src/provider/openai/mappers/openai-mappers'

function makeChatCompletion(
  overrides: {
    choices?: ChatCompletion['choices']
    id?: string
    model?: string
    usage?: ChatCompletion['usage']
  } = {},
): ChatCompletion {
  return {
    id: overrides.id ?? 'chatcmpl-1',
    object: 'chat.completion',
    created: 0,
    model: overrides.model ?? 'gpt-4.1-mini',
    choices: overrides.choices ?? [
      {
        index: 0,
        finish_reason: 'stop',
        logprobs: null,
        message: {
          role: 'assistant',
          content: 'Hello',
          refusal: null,
        },
      },
    ],
    usage: Object.prototype.hasOwnProperty.call(overrides, 'usage')
      ? overrides.usage
      : {
          prompt_tokens: 3,
          completion_tokens: 5,
          total_tokens: 8,
        },
  }
}

describe('OpenAI response mapping', () => {
  describe('Given a completion with assistant text', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns normalized text content and usage', () => {
        const response = mapFromOpenAIChatCompletion(
          makeChatCompletion({
            id: 'chatcmpl-text',
            choices: [
              {
                index: 0,
                finish_reason: 'stop',
                logprobs: null,
                message: {
                  role: 'assistant',
                  content: 'Hello from OpenAI',
                  refusal: null,
                },
              },
            ],
          }),
        )

        expect(response).toEqual({
          content: [
            {
              type: ContentKind.Text,
              text: 'Hello from OpenAI',
            },
          ],
          model: 'gpt-4.1-mini',
          providerResponseId: 'chatcmpl-text',
          stopReason: LLMStopReason.Completed,
          usage: {
            inputTokens: 3,
            outputTokens: 5,
          },
        })
      })
    })
  })

  describe('Given a completion with tool calls', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns tool-use content with decoded JSON input', () => {
        const response = mapFromOpenAIChatCompletion(
          makeChatCompletion({
            choices: [
              {
                index: 0,
                finish_reason: 'tool_calls',
                logprobs: null,
                message: {
                  role: 'assistant',
                  content: null,
                  refusal: null,
                  tool_calls: [
                    {
                      id: 'call_1',
                      type: 'function',
                      function: {
                        name: 'lookup',
                        arguments: '{"query":"weather"}',
                      },
                    },
                  ],
                },
              },
            ],
          }),
        )

        expect(response.content).toEqual([
          {
            type: ContentKind.ToolUse,
            id: 'call_1',
            name: 'lookup',
            input: {
              query: 'weather',
            },
          },
        ])
        expect(response.stopReason).toBe(LLMStopReason.ToolUse)
      })
    })
  })

  describe('Given a completion with text plus tool calls', () => {
    describe('When mapping from OpenAI', () => {
      it('Then preserves text before tool-use blocks', () => {
        const response = mapFromOpenAIChatCompletion(
          makeChatCompletion({
            choices: [
              {
                index: 0,
                finish_reason: 'tool_calls',
                logprobs: null,
                message: {
                  role: 'assistant',
                  content: 'I will look that up',
                  refusal: null,
                  tool_calls: [
                    {
                      id: 'call_2',
                      type: 'function',
                      function: {
                        name: 'search',
                        arguments: '{}',
                      },
                    },
                  ],
                },
              },
            ],
          }),
        )

        expect(response.content).toEqual([
          {
            type: ContentKind.Text,
            text: 'I will look that up',
          },
          {
            type: ContentKind.ToolUse,
            id: 'call_2',
            name: 'search',
            input: {},
          },
        ])
      })
    })
  })

  describe('Given a tool call with invalid JSON arguments', () => {
    describe('When mapping from OpenAI', () => {
      it('Then throws LLMResponseDecodingError', () => {
        expect(() =>
          mapFromOpenAIChatCompletion(
            makeChatCompletion({
              choices: [
                {
                  index: 0,
                  finish_reason: 'tool_calls',
                  logprobs: null,
                  message: {
                    role: 'assistant',
                    content: null,
                    refusal: null,
                    tool_calls: [
                      {
                        id: 'call_bad',
                        type: 'function',
                        function: {
                          name: 'lookup',
                          arguments: 'not-json',
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          ),
        ).toThrow(LLMResponseDecodingError)
      })
    })
  })

  describe('Given a completion without usage', () => {
    describe('When mapping from OpenAI', () => {
      it('Then reports zero token counts', () => {
        const response = mapFromOpenAIChatCompletion(
          makeChatCompletion({
            usage: undefined,
          }),
        )

        expect(response.usage).toEqual({
          inputTokens: 0,
          outputTokens: 0,
        })
      })
    })
  })

  describe('Given a completion with empty choices', () => {
    describe('When mapping from OpenAI', () => {
      it('Then throws LLMEmptyResponseError', () => {
        expect(() =>
          mapFromOpenAIChatCompletion(
            makeChatCompletion({
              choices: [],
            }),
          ),
        ).toThrow(LLMEmptyResponseError)
      })
    })
  })

  describe('Given a completion with no assistant content', () => {
    describe('When mapping from OpenAI', () => {
      it('Then throws LLMEmptyResponseError', () => {
        expect(() =>
          mapFromOpenAIChatCompletion(
            makeChatCompletion({
              choices: [
                {
                  index: 0,
                  finish_reason: 'stop',
                  logprobs: null,
                  message: {
                    role: 'assistant',
                    content: null,
                    refusal: null,
                  },
                },
              ],
            }),
          ),
        ).toThrow(LLMEmptyResponseError)
      })
    })
  })

  describe('Given a custom tool call', () => {
    describe('When mapping from OpenAI', () => {
      it('Then returns tool-use content from custom input', () => {
        const response = mapFromOpenAIChatCompletion(
          makeChatCompletion({
            choices: [
              {
                index: 0,
                finish_reason: 'tool_calls',
                logprobs: null,
                message: {
                  role: 'assistant',
                  content: null,
                  refusal: null,
                  tool_calls: [
                    {
                      id: 'call_custom',
                      type: 'custom',
                      custom: {
                        name: 'browser',
                        input: '{"url":"https://example.com"}',
                      },
                    },
                  ],
                },
              },
            ],
          }),
        )

        expect(response.content).toEqual([
          {
            type: ContentKind.ToolUse,
            id: 'call_custom',
            name: 'browser',
            input: {
              url: 'https://example.com',
            },
          },
        ])
      })
    })
  })

  describe('Given a tool call with non-object JSON arguments', () => {
    describe('When mapping from OpenAI', () => {
      it('Then throws LLMResponseDecodingError', () => {
        expect(() =>
          mapFromOpenAIChatCompletion(
            makeChatCompletion({
              choices: [
                {
                  index: 0,
                  finish_reason: 'tool_calls',
                  logprobs: null,
                  message: {
                    role: 'assistant',
                    content: null,
                    refusal: null,
                    tool_calls: [
                      {
                        id: 'call_array',
                        type: 'function',
                        function: {
                          name: 'lookup',
                          arguments: '["a","b"]',
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          ),
        ).toThrow(LLMResponseDecodingError)
      })
    })
  })

  describe('Given an unsupported tool-call type', () => {
    describe('When mapping from OpenAI', () => {
      it('Then throws LLMToolCallNotSupportedError', () => {
        expect(() =>
          mapFromOpenAIChatCompletion(
            makeChatCompletion({
              choices: [
                {
                  index: 0,
                  finish_reason: 'tool_calls',
                  logprobs: null,
                  message: {
                    role: 'assistant',
                    content: null,
                    refusal: null,
                    tool_calls: [
                      {
                        id: 'call_weird',
                        type: 'unknown_kind',
                      } as never,
                    ],
                  },
                },
              ],
            }),
          ),
        ).toThrow(LLMToolCallNotSupportedError)
      })
    })
  })

  describe('Given OpenAI finish reasons', () => {
    describe('When mapping from OpenAI', () => {
      it.each([
        ['stop', LLMStopReason.Completed],
        ['length', LLMStopReason.MaximumOutputTokensReached],
        ['tool_calls', LLMStopReason.ToolUse],
        ['function_call', LLMStopReason.ToolUse],
        ['content_filter', LLMStopReason.ContentFiltered],
        [null, LLMStopReason.Unknown],
      ] as const)('Then maps finish_reason %j to %s', (finishReason, expectedStopReason) => {
        const response = mapFromOpenAIChatCompletion(
          makeChatCompletion({
            choices: [
              {
                index: 0,
                finish_reason: finishReason as ChatCompletion['choices'][number]['finish_reason'],
                logprobs: null,
                message: {
                  role: 'assistant',
                  content:
                    finishReason === 'content_filter'
                      ? null
                      : finishReason === 'tool_calls' || finishReason === 'function_call'
                        ? null
                        : 'done',
                  refusal: null,
                  ...(finishReason === 'tool_calls' || finishReason === 'function_call'
                    ? {
                        tool_calls: [
                          {
                            id: 'call_finish',
                            type: 'function' as const,
                            function: {
                              name: 'noop',
                              arguments: '{}',
                            },
                          },
                        ],
                      }
                    : {}),
                },
              },
            ],
          }),
        )

        expect(response.stopReason).toBe(expectedStopReason)
      })
    })
  })
})
