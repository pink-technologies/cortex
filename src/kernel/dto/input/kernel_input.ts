// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { SourceType } from '../../types/source-type';

/**
 * Context associated with a kernel input.
 *
 * The meaning of optional fields depends on the input source.
 *
 * **When `source` is `'chat'`**
 * - Set **`chatId`** for a chat-bound agent run.
 * - Optionally set **`intent`** to help resolve the target agent.
 *
 * **When `source` is `'webhook'`**
 * - Set **`externalProvider`** (for example `github`, `jira`, `stripe`, `slack`).
 * - Set **`eventType`** to the provider event name (for example GitHub `pull_request`
 *   or Stripe `invoice.paid`).
 */
export interface KernelContext {
  /**
   * The source that originated the kernel input.
   */
  origin: SourceType;

  /**
   * The identifier of the chat associated with the input.
   *
   * This value is required when `source` is `'chat'`.
   */
  chatId?: string;

  /**
   * An optional intent hint used to resolve or specialize the target agent.
   */
  intent?: string;

  /**
   * The name of the external provider that originated the input.
   *
   * Examples include `github`, `jira`, `stripe`, or `slack`.
   */
  externalProvider?: string;

  /**
   * The provider-specific event type associated with the input.
   *
   * Examples include GitHub `pull_request` or Stripe `invoice.paid`.
   */
  eventType?: string;

  /**
   * An optional provider-side reference associated with the input.
   *
   * Examples include an issue key, pull request number, or event identifier.
   */
  externalReference?: string;
}

/**
 * Input passed to the kernel entrypoint.
 *
 * `KernelInput` contains the normalized payload to process and the
 * contextual metadata required to resolve the target agent and execution path.
 */
export interface KernelInput {
  /**
   * The normalized payload to be processed by the kernel.
   */
  payload: string;

  /**
   * The contextual metadata associated with the payload.
   */
  context: KernelContext;
}