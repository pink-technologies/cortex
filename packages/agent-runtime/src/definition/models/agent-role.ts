// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Canonical agent responsibility identifiers declared on a manifest's `role`
 * field and stored on {@link AgentDescriptor.role}.
 *
 * Use these constants when selecting or comparing roles:
 *
 * - `main` — primary / orchestrating agent for a workspace (typically one).
 * - `specialist` — focused agent that usually receives delegated work.
 *
 * Wire values are lowercase so they stay stable across manifest formats
 * (TOML/JSON) and Zod validation via {@link agentSchema}.
 */
export const AgentRole = {
  Main: 'main',
  Specialist: 'specialist',
} as const

/**
 * Supported agent role identifier.
 *
 * Derived from {@link AgentRole} so runtime comparisons and the TypeScript
 * union remain synchronized.
 */
export type AgentRole = (typeof AgentRole)[keyof typeof AgentRole]
