// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentRunResponseDto } from '@/agents/dto/response/agent-run/agent-run.response.dto';

/**
 * Webhook ingress response for now: a single acknowledgement line (e.g. GitHub PR opened).
 * Extend later with provider metadata, actions taken, etc.
 */
export interface AgentWebhookResponse {
  /** 
   * Fixed acknowledgement for now (e.g. `"ok"`). 
   */
  message: string;
}

/** Chat ingress: agent run bound to the conversation. */
export interface AgentHandleChatResult {
  /**
   * The source of the result (e.g. `chat`, `webhook`).
   */
  source: 'chat';

  /**
   * The agent ID.
   */
  agentId: string;

  /**
   * The agent run.
   */
  run: AgentRunResponseDto;
}

/** Webhook ingress: acknowledgement for the external caller. */
export interface AgentHandleWebhookResult {
  /**
   * The source of the result (e.g. `chat`, `webhook`).
   */
  source: 'webhook';

  /**
   * The agent ID.
   */
  agentId: string;
  external: AgentWebhookResponse;
}

/**
 * Kernel handle outcome: shape depends on how the request entered.
 * - **chat** → {@link AgentHandleChatResult} (`run` present, no `external`).
 * - **webhook** → {@link AgentHandleWebhookResult} (`external` present, no `run`).
 */
export type AgentHandleResult =
  | AgentHandleChatResult
  | AgentHandleWebhookResult;
