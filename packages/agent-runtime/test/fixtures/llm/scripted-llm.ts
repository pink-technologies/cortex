// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { LLM, LLMRequest, LLMResponse } from '@cortex/llm'

/**
 * A scripted language-model response, optionally delayed before return.
 */
export type ScriptedLLMResponse = LLMResponse & {
  /**
   * Optional delay applied before this response is returned.
   *
   * Useful for timeout and cancellation tests. The delay respects request
   * cancellation via {@link LLMRequest.signal}.
   */
  readonly delayMilliseconds?: number
}

/**
 * Fake language model that returns a predefined sequence of responses.
 *
 * `ScriptedLLM` records every request it receives, allowing tests to verify
 * that conversation messages, tool definitions, and tool results are passed
 * correctly between agent turns.
 */
export class ScriptedLLM implements LLM {
  // MARK: - Private Properties

  private readonly recordedRequests: LLMRequest[] = []

  private readonly responses: ScriptedLLMResponse[]

  // MARK: - Computed Properties

  /**
   * Requests received by the fake language model.
   *
   * Each request is stored with snapshots of its message and tool collections
   * so later conversation mutations do not affect previous request records.
   */
  get requests(): readonly LLMRequest[] {
    return this.recordedRequests
  }

  /**
   * Number of scripted responses that have not yet been returned.
   */
  get remainingResponseCount(): number {
    return this.responses.length
  }

  // MARK: - Constructor

  /**
   * Creates a scripted language model.
   *
   * Responses are returned in the same order in which they are provided.
   *
   * @param responses - Responses to return for successive completion requests.
   */
  constructor(responses: readonly ScriptedLLMResponse[]) {
    this.responses = [...responses]
  }

  // MARK: - LLM

  /**
   * Returns the next scripted language-model response.
   *
   * @param request - Completion request produced by the agent.
   * @returns The next available scripted response.
   * @throws When the request is cancelled or no scripted response remains.
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    request.signal?.throwIfAborted()

    this.recordedRequests.push(this.snapshot(request))

    const response = this.responses.shift()

    if (!response) {
      throw new Error('No scripted LLM response is available.')
    }

    if (response.delayMilliseconds !== undefined && response.delayMilliseconds > 0) {
      await this.wait(response.delayMilliseconds, request.signal)
    }

    request.signal?.throwIfAborted()

    const { delayMilliseconds: _delayMilliseconds, ...llmResponse } = response

    return llmResponse
  }

  // MARK: - Private Methods

  /**
   * Creates a stable snapshot of an LLM request.
   */
  private snapshot(request: LLMRequest): LLMRequest {
    return {
      ...request,
      messages: [...request.messages],
      tools: request.tools ? [...request.tools] : undefined,
    }
  }

  /**
   * Waits for the specified duration or until the signal is aborted.
   */
  private async wait(delayMilliseconds: number, signal?: AbortSignal): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }, delayMilliseconds)

      const onAbort = (): void => {
        clearTimeout(timeout)

        try {
          signal?.throwIfAborted()
          reject(new Error('Request was aborted.'))
        } catch (error) {
          reject(error)
        }
      }

      if (signal?.aborted) {
        clearTimeout(timeout)
        onAbort()
        return
      }

      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }
}
