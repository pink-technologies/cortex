// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Request passed to an {@link ExecutionEngine} for one external agentic run.
 */
export interface ExecutionEngineRequest {
  /**
   * Optional Cortex agent id that owns this run (for runtime-backed engines).
   */
  readonly agentId?: string

  /**
   * Absolute path of the workspace the engine should operate in.
   */
  readonly cwd: string

  /**
   * Prompt forwarded to the external engine.
   */
  readonly prompt: string

  /**
   * Abort signal used to cancel cooperative work.
   */
  readonly signal: AbortSignal
}
