// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Agent } from '@cursor/sdk'
import { Inject, Injectable } from '@nestjs/common'
import { NODE_CONFIGURATION, type NodeConfiguration } from '../../configuration'
import type { ExecutionEngine } from '../execution-engine'
import type { ExecutionEngineRequest, ExecutionEngineResult } from '../models'
import { mapCursorExecutionError } from './cursor-execution-error'

/**
 * {@link ExecutionEngine} backed by the Cursor Agent SDK.
 *
 * Runs a one-shot local agent against the prepared workspace directory using
 * {@link Agent.prompt}. Requires {@link NodeConfiguration.cursorApiKey}.
 * Transport and SDK failures are mapped to {@link Error} values with a stable
 * `code` so the job poller can report `FAILED` without crashing the Node.
 */
@Injectable()
export class CursorExecutionEngine implements ExecutionEngine {
  // MARK: - Constructor

  /**
   * Creates a Cursor-backed execution engine.
   *
   * @param configuration - Node configuration providing the Cursor API key.
   */
  constructor(
    @Inject(NODE_CONFIGURATION)
    private readonly configuration: NodeConfiguration,
  ) {}

  // MARK: - ExecutionEngine

  /**
   * Runs a Cursor local agent against the request workspace.
   *
   * @param request - Workspace, prompt, and cancellation controls.
   * @returns The agent textual result.
   * @throws When the Cursor API key is missing or the run fails / is cancelled.
   */
  async run(request: ExecutionEngineRequest): Promise<ExecutionEngineResult> {
    request.signal.throwIfAborted()

    const apiKey = this.configuration.cursorApiKey

    if (!apiKey) {
      throw new Error('CURSOR_API_KEY is required to run the Cursor execution engine.')
    }

    try {
      const result = await Agent.prompt(request.prompt, {
        apiKey,
        local: {
          cwd: request.cwd,
        },
        model: {
          id: 'composer-2.5',
        },
      })

      request.signal.throwIfAborted()

      if (result.status !== 'finished') {
        throw new Error(`Cursor agent run ended with status '${result.status}'.`)
      }

      return {
        output: result.result ?? '',
      }
    } catch (error) {
      request.signal.throwIfAborted()
      throw mapCursorExecutionError(error)
    }
  }
}
