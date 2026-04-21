// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { TrelloClient } from "../../clients/trello-client";

/**
 * Per-execution tool context: integrations scoped to the current user or tenant.
 *
 * Orchestration (kernel, capability resolver, etc.) should populate this from stored
 * credentials before calling {@link Tool.execute} — e.g. {@link buildTrelloClientFromCredentials}
 * for Trello when the user has linked that capability.
 */
export type ToolContext = {
    /**
     * Trello API client for this user; omit or set `null` when Trello is not linked.
     */
    trelloClient?: TrelloClient | null;
};