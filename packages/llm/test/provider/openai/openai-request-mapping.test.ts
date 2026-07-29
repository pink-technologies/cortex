// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ContentKind } from '../../../src/content'
import { LLMMessageRole } from '../../../src/message/llm-message-role'
import { LLMInvalidRequestError, LLMMessageRoleNotSupportedError } from '../../../src/error/error'
import {
  mapToOpenAIMessageList,
  mapToOpenAIMessages,
  mapToOpenAITool,
} from '../../../src/provider/openai/mappers/openai-mappers'

describe('OpenAI request mapping', () => {
  describe('Given a non-empty system prompt', () => {
    describe('When mapping to an OpenAI message list', () => {
      it('Then inserts a leading system message before conversation turns', () => {
        const messages = mapToOpenAIMessageList(
          [
            {
              role: LLMMessageRole.User,
              content: [
                {
                  type: ContentKind.Text,
                  text: 'Hello',
                },
              ],
            },
          ],
          'You are a helpful assistant.',
        )

        expect(messages).toEqual([
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: 'Hello',
          },
        ])
      })
    })
  })

  describe('Given a blank system prompt', () => {
    describe('When mapping to an OpenAI message list', () => {
      it('Then omits the system message', () => {
        const messages = mapToOpenAIMessageList(
          [
            {
              role: LLMMessageRole.User,
              content: [
                {
                  type: ContentKind.Text,
                  text: 'Hello',
                },
              ],
            },
          ],
          '   ',
        )

        expect(messages).toEqual([
          {
            role: 'user',
            content: 'Hello',
          },
        ])
      })
    })
  })

  describe('Given a user message with text and images', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then builds ordered multimodal content parts', () => {
        const messages = mapToOpenAIMessages([
          {
            role: LLMMessageRole.User,
            content: [
              {
                type: ContentKind.Text,
                text: 'Describe this image',
              },
              {
                type: ContentKind.Image,
                source: {
                  type: 'base64',
                  mediaType: 'image/png',
                  data: 'abc123',
                },
              },
            ],
          },
        ])

        expect(messages).toEqual([
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this image',
              },
              {
                type: 'image_url',
                image_url: {
                  url: 'data:image/png;base64,abc123',
                },
              },
            ],
          },
        ])
      })
    })
  })

  describe('Given a user message with a single text block', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then uses the compact string content form', () => {
        const messages = mapToOpenAIMessages([
          {
            role: LLMMessageRole.User,
            content: [
              {
                type: ContentKind.Text,
                text: 'Ping',
              },
            ],
          },
        ])

        expect(messages).toEqual([
          {
            role: 'user',
            content: 'Ping',
          },
        ])
      })
    })
  })

  describe('Given an assistant message with tool calls', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then maps tool-use blocks to function tool_calls', () => {
        const messages = mapToOpenAIMessages([
          {
            role: LLMMessageRole.Assistant,
            content: [
              {
                type: ContentKind.Text,
                text: 'Calling a tool',
              },
              {
                type: ContentKind.ToolUse,
                id: 'call_1',
                name: 'lookup',
                input: {
                  query: 'weather',
                },
              },
            ],
          },
        ])

        expect(messages).toEqual([
          {
            role: 'assistant',
            content: 'Calling a tool',
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
        ])
      })
    })
  })

  describe('Given a tool message with tool results', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then expands each result into a separate tool message', () => {
        const messages = mapToOpenAIMessages([
          {
            role: LLMMessageRole.Tool,
            content: [
              {
                type: ContentKind.ToolResult,
                toolUseId: 'call_1',
                content: '{"ok":true}',
              },
              {
                type: ContentKind.ToolResult,
                toolUseId: 'call_2',
                content: 'failed',
                isError: true,
              },
            ],
          },
        ])

        expect(messages).toEqual([
          {
            role: 'tool',
            tool_call_id: 'call_1',
            content: '{"ok":true}',
          },
          {
            role: 'tool',
            tool_call_id: 'call_2',
            content: 'failed',
          },
        ])
      })
    })
  })

  describe('Given an assistant message with only text', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then omits tool_calls', () => {
        const messages = mapToOpenAIMessages([
          {
            role: LLMMessageRole.Assistant,
            content: [
              {
                type: ContentKind.Text,
                text: 'Just text',
              },
            ],
          },
        ])

        expect(messages).toEqual([
          {
            role: 'assistant',
            content: 'Just text',
          },
        ])
      })
    })
  })

  describe('Given an assistant message with only tool calls', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then sets content to null and includes tool_calls', () => {
        const messages = mapToOpenAIMessages([
          {
            role: LLMMessageRole.Assistant,
            content: [
              {
                type: ContentKind.ToolUse,
                id: 'call_only',
                name: 'lookup',
                input: {
                  q: 1,
                },
              },
            ],
          },
        ])

        expect(messages).toEqual([
          {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_only',
                type: 'function',
                function: {
                  name: 'lookup',
                  arguments: '{"q":1}',
                },
              },
            ],
          },
        ])
      })
    })
  })

  describe('Given a Cortex tool definition', () => {
    describe('When mapping to an OpenAI tool', () => {
      it('Then produces a function tool with schema parameters', () => {
        const tool = mapToOpenAITool({
          name: 'lookup',
          description: 'Look up a value',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
              },
            },
          },
        })

        expect(tool).toEqual({
          type: 'function',
          function: {
            name: 'lookup',
            description: 'Look up a value',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                },
              },
            },
          },
        })
      })
    })
  })

  describe('Given an unsupported message role', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then throws LLMMessageRoleNotSupportedError', () => {
        expect(() =>
          mapToOpenAIMessages([
            {
              role: 'system' as typeof LLMMessageRole.User,
              content: [
                {
                  type: ContentKind.Text,
                  text: 'Nope',
                },
              ],
            },
          ]),
        ).toThrow(LLMMessageRoleNotSupportedError)
      })
    })
  })

  describe('Given an assistant message with unsupported content', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then throws LLMInvalidRequestError', () => {
        expect(() =>
          mapToOpenAIMessages([
            {
              role: LLMMessageRole.Assistant,
              content: [
                {
                  type: ContentKind.Image,
                  source: {
                    type: 'base64',
                    mediaType: 'image/png',
                    data: 'abc',
                  },
                },
              ],
            },
          ]),
        ).toThrow(LLMInvalidRequestError)
      })
    })
  })

  describe('Given an empty assistant message', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then throws LLMInvalidRequestError', () => {
        expect(() =>
          mapToOpenAIMessages([
            {
              role: LLMMessageRole.Assistant,
              content: [],
            },
          ]),
        ).toThrow(LLMInvalidRequestError)
      })
    })
  })

  describe('Given a user message with unsupported content', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then throws LLMInvalidRequestError', () => {
        expect(() =>
          mapToOpenAIMessages([
            {
              role: LLMMessageRole.User,
              content: [
                {
                  type: ContentKind.ToolUse,
                  id: 'call_1',
                  name: 'lookup',
                  input: {},
                },
              ],
            },
          ]),
        ).toThrow(LLMInvalidRequestError)
      })
    })
  })

  describe('Given an empty user message', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then throws LLMInvalidRequestError', () => {
        expect(() =>
          mapToOpenAIMessages([
            {
              role: LLMMessageRole.User,
              content: [],
            },
          ]),
        ).toThrow(LLMInvalidRequestError)
      })
    })
  })

  describe('Given an empty tool message', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then throws LLMInvalidRequestError', () => {
        expect(() =>
          mapToOpenAIMessages([
            {
              role: LLMMessageRole.Tool,
              content: [],
            },
          ]),
        ).toThrow(LLMInvalidRequestError)
      })
    })
  })

  describe('Given a tool message with non-result content', () => {
    describe('When mapping to OpenAI messages', () => {
      it('Then throws LLMInvalidRequestError', () => {
        expect(() =>
          mapToOpenAIMessages([
            {
              role: LLMMessageRole.Tool,
              content: [
                {
                  type: ContentKind.Text,
                  text: 'not a tool result',
                },
              ],
            },
          ]),
        ).toThrow(LLMInvalidRequestError)
      })
    })
  })
})
