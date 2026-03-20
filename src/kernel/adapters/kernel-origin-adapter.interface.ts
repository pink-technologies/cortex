// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentHandleResult, KernelInput } from '../dto';
import type { SourceType } from '../types/source-type';

/**
 * Injection token for registering origin adapters with Nest multi-provider:
 * `{ provide: KERNEL_ORIGIN_ADAPTER, useClass: XAdapter, multi: true }`.
 *
 * {@link KernelOriginAdapterRegistry} injects `KernelOriginAdapter[]` and builds
 * a map keyed by {@link KernelOriginAdapter.origin}.
 */
export const KERNEL_ORIGIN_ADAPTER = Symbol('KERNEL_ORIGIN_ADAPTER');

/**
 * Handles kernel ingress for a single {@link SourceType} (e.g. chat, webhook).
 *
 * The kernel resolves the agent once, then delegates with
 * `registry.get(origin).handle(input, agentId)`.
 */
export interface KernelOriginAdapter {
  /**
   * Origin this adapter serves. Must be unique among registered adapters.
   */
  readonly origin: SourceType;

  /**
   * Handles the origin-specific pipeline after the agent id has been resolved.
   *
   * @param input - Normalized payload and context from the kernel entrypoint.
   * @param agentId - Agent resolved by the kernel (intent / default agent rules).
   */
  handle(input: KernelInput, agentId: string): Promise<AgentHandleResult>;
}
