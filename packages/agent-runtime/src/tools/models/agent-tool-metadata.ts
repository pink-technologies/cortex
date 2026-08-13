// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentToolPermission } from "../datatypes"

/**
 * Side-effect class of an {@link AgentTool}.
 *
 * Prefer these constants at call sites instead of raw strings:
 *
 * ```ts
 * metadata: {
 *   effect: AgentToolEffect.Read,
 *   idempotency: AgentToolIdempotency.Idempotent,
 * }
 * ```
 *
 * Used by policy, authorization, and auditing to reason about what a tool
 * may do without inspecting its implementation.
 */
export const AgentToolEffect = {
  /**
   * Runs a process, command, or other side-effecting action that is neither
   * a pure read nor a durable write of agent-managed state.
   */
  Execute: 'execute',

  /**
   * Observes state without mutating it (for example fetch, list, or search).
   */
  Read: 'read',

  /**
   * Creates, updates, or deletes durable state (for example files or records).
   */
  Write: 'write',
} as const

/**
 * Union of string literals in {@link AgentToolEffect}.
 */
export type AgentToolEffect = (typeof AgentToolEffect)[keyof typeof AgentToolEffect]

/**
 * Idempotency class of an {@link AgentTool}.
 *
 * Prefer these constants at call sites instead of raw strings:
 *
 * ```ts
 * metadata: {
 *   effect: AgentToolEffect.Write,
 *   idempotency: AgentToolIdempotency.Conditional,
 * }
 * ```
 *
 * Used by retry and orchestration policy to decide whether repeating a call
 * with the same input is safe.
 */
export const AgentToolIdempotency = {
  /**
   * Safe to retry only when the caller supplies an idempotency key or other
   * explicit deduplication guarantee.
   */
  Conditional: 'conditional',

  /**
   * Safe to repeat with the same input; additional invocations do not change
   * observable outcomes beyond the first successful call.
   */
  Idempotent: 'idempotent',

  /**
   * Repeating the call may apply the effect again (for example duplicate
   * writes or additional side effects).
   */
  NonIdempotent: 'non_idempotent',
} as const

/**
 * Union of string literals in {@link AgentToolIdempotency}.
 */
export type AgentToolIdempotency = (typeof AgentToolIdempotency)[keyof typeof AgentToolIdempotency]

/**
 * Declarative policy metadata for an {@link AgentTool}.
 *
 * Describes effect class, idempotency, and optional permission requirements
 * for authorization and orchestration. It is not presented to the language
 * model.
 */
export interface AgentToolMetadata {
  /**
   * Side-effect class of the tool.
   *
   * Prefer {@link AgentToolEffect} constants over raw strings.
   */
  readonly effect: AgentToolEffect

  /**
   * Whether repeating the tool with the same input is safe.
   *
   * Prefer {@link AgentToolIdempotency} constants over raw strings.
   */
  readonly idempotency: AgentToolIdempotency

  /**
   * Permission identifiers required before the tool may run.
   *
   * Empty or omitted means no extra permission check beyond tool eligibility
   * in the execution scope.
   */
  readonly permissions: readonly AgentToolPermission[]
}
