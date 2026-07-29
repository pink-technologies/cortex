// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

const openAICreateMock = jest.fn()

jest.mock('openai', () => {
  const actual = jest.requireActual<typeof import('openai')>('openai')
  const ActualOpenAI = actual.default

  function MockOpenAI(this: {
    chat: {
      completions: {
        create: jest.Mock
      }
    }
  }) {
    this.chat = {
      completions: {
        create: openAICreateMock,
      },
    }
  }

  Object.assign(MockOpenAI, ActualOpenAI)

  return {
    __esModule: true,
    default: MockOpenAI,
  }
})

import OpenAI from 'openai'
import { ContentKind } from '../../../src/content'
import { LLMRequestCancelledError } from '../../../src/error/error'
import { LLMMessageRole } from '../../../src/message/llm-message-role'
import { OpenAILLM } from '../../../src/provider/openai/openai-llm'

describe('OpenAILLM', () => {
  describe('Given temperature and max output tokens on a request', () => {
    describe('When completing through OpenAILLM', () => {
      it('Then forwards them as temperature and max_tokens', async () => {
        openAICreateMock.mockResolvedValue({
          id: 'chatcmpl-test',
          model: 'gpt-4.1-mini',
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: 'ok',
                refusal: null,
              },
              logprobs: null,
            },
          ],
          usage: {
            prompt_tokens: 1,
            completion_tokens: 1,
            total_tokens: 2,
          },
        })

        const llm = new OpenAILLM('test-key')

        await llm.complete({
          model: 'gpt-4.1-mini',
          temperature: 0.2,
          maxOutputTokens: 128,
          messages: [
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
          tools: [
            {
              name: 'lookup',
              parameters: {
                type: 'object',
              },
            },
          ],
          signal: AbortSignal.timeout(5_000),
          timeoutMilliseconds: 5_000,
        })

        expect(openAICreateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'gpt-4.1-mini',
            temperature: 0.2,
            max_tokens: 128,
            stream: false,
            tools: [
              {
                type: 'function',
                function: {
                  name: 'lookup',
                  description: undefined,
                  parameters: {
                    type: 'object',
                  },
                },
              },
            ],
          }),
          expect.objectContaining({
            timeout: 5_000,
          }),
        )
      })
    })
  })

  describe('Given the OpenAI client rejects the request', () => {
    describe('When completing through OpenAILLM', () => {
      it('Then remaps the failure through mapFromOpenAIError', async () => {
        openAICreateMock.mockRejectedValue(new OpenAI.APIUserAbortError())

        const llm = new OpenAILLM('test-key')

        await expect(
          llm.complete({
            model: 'gpt-4.1-mini',
            messages: [
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
          }),
        ).rejects.toBeInstanceOf(LLMRequestCancelledError)
      })
    })
  })
})
