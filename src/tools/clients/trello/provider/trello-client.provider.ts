// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
    TrelloAPIKeyNotConfiguredError,
    TrelloTokenNotConfiguredError,
} from "../catalog/error/trello.error";
import { TrelloClient } from "../trello-client";

/**
 * Builds a {@link TrelloClient} for the **current user / tenant** from stored credentials
 * (e.g. Trello capability). Call this when assembling {@link ToolContext} for a kernel run —
 * not at application bootstrap.
 *
 * @throws {@link TrelloAPIKeyNotConfiguredError} When `apiKey` is missing or blank.
 * @throws {@link TrelloTokenNotConfiguredError} When `token` is missing or blank.
 */
export function buildTrelloClient(apiKey: string, token: string): TrelloClient {
    const key = apiKey.trim();
    const t = token.trim();

    if (!key) {
        throw new TrelloAPIKeyNotConfiguredError();
    }

    if (!t) {
        throw new TrelloTokenNotConfiguredError();
    }

    return new TrelloClient(key, t);
}
