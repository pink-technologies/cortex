// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ExecutionEngineRequest, ExecutionEngineResult } from './models'

/**
 * Nest injection token for the active {@link ExecutionEngine}.
 */
export const EXECUTION_ENGINE = Symbol('EXECUTION_ENGINE')

/**
 * Boundary for invoking an agentic execution engine.
 *
 * Cortex uses this contract so job handlers stay decoupled from a specific
 * provider. Implementations wrap SDKs such as `@cursor/sdk` or
 * {@link AgentRuntime}.
 */
export interface ExecutionEngine {
  /**
   * Runs the engine against the provided workspace and prompt.
   *
   * @param request - Workspace, prompt, and cancellation controls.
   * @returns The engine's textual output.
   */
  run(request: ExecutionEngineRequest): Promise<ExecutionEngineResult>
}
