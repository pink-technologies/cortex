// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentToolPermission } from "@/tools/datatypes"

/**
 * Runtime information for one agent execution run.
 *
 * Passed into {@link Agent.nextTurn} (and forwarded by implementations such as
 * {@link LlmAgent} into {@link LLM.complete}) so the kernel can correlate work
 * and cancel in-flight operations without embedding that state on the agent
 * definition.
 *
 * This is per-execution context only—not static catalog configuration from
 * {@link AgentDefinition}.
 */
export interface AgentExecutionContext {
  /**
   * Stable identifier for this execution run.
   *
   * Used for logging, tracing, and correlating nested work (LLM calls, tool
   * runs, delegations). Distinct from agent ids and provider completion ids.
   */
  readonly executionId: string

  /**
   * Permission identifiers granted for this execution.
   *
   * Compared against {@link AgentToolMetadata.permissions} before a tool may
   * run. An empty set grants no permission-gated tools.
   */
  readonly permissions: ReadonlySet<AgentToolPermission>

  /**
   * Abort signal for cooperative cancellation of this execution.
   *
   * When aborted, the agent and its dependencies should stop in-flight work
   * (for example by passing the signal to {@link LLMRequest.signal}). Distinct
   * from request timeouts configured on the LLM client.
   */
  readonly signal: AbortSignal
}
