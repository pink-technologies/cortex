// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { SourceType } from '../../types/source-type';

/**
 * Context bundled with a kernel handle call. The meaning of optional fields depends on
 * {@link SourceType}.
 *
 * **When `source` is `'chat'`**
 * - Set **`chatId`** (required for a chat-bound agent run).
 * - Optionally set **`intent`** to route or specialize the agent.
 *
 * **When `source` is `'webhook'`**
 * - Set **`externalProvider`** (e.g. `github`, `jira`, `stripe`, `slack`).
 * - Set **`eventType`** to the provider’s event name (e.g. GitHub `pull_request`,
 *   Stripe `invoice.paid`).
 */
export interface ContextPayload {
  /**
   * The source of the context (e.g. `chat`, `webhook`).
   */
  source: SourceType;

  /**
   * The chat ID (required for a chat-bound agent run).
   */
  chatId?: string;

  /**
   * The intent (e.g. `summarize`, `answer_question`, etc.).
   */
  intent?: string;

  /** The external provider. */
  externalProvider?: string;

  /** 
   * The event type (e.g. GitHub `pull_request`, Stripe `invoice.paid`, etc.).
   */
  eventType?: string;

  /**
   * Optional provider-side id (issue key, PR number, Stripe event id, etc.).
   */
  externalReference?: string;
}

/**
 * Input to the kernel’s single entrypoint: one user-facing 
 * line plus structured context.
 */
export interface KernelHandleParameters {
  /**
   * The message content.
   */
  message: string;

  /**
   * The context payload.
   */
  context: ContextPayload;
}
