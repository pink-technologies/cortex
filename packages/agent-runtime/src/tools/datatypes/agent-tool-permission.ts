// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Identifies authority required to execute an agent tool.
 *
 * Permission names should use stable namespaced identifiers such as
 * `github.pull_request.read` or `github.review.write`.
 */
export type AgentToolPermission = string