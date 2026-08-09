// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '@cortex/networking'
import type { TrelloClient } from '../../trello-client'
import { TrelloCardCreationError } from './error/error'
import { TrelloCard, type TrelloCardResponse } from './models'
import { TrelloCreateCardParameters } from './parameters'

/**
 * Trello REST resource for the `/cards` path.
 *
 * Creates cards on a board list. Transport and auth are provided by the
 * injected {@link TrelloClient}. Wire payloads are mapped to {@link TrelloCard}
 * via {@link TrelloCard.from}.
 */
export class TrelloCardResource {
  // MARK: - Properties

  private readonly client: TrelloClient

  // MARK: - Constructor

  /**
   * Creates a card resource bound to a Trello client.
   *
   * @param client - Authenticated client for the target Trello account.
   */
  constructor(client: TrelloClient) {
    this.client = client
  }

  // MARK: - Instance methods

  /**
   * Creates a card via `POST /cards`.
   *
   * Places the card on `input.listId` with the given title. An omitted
   * description is sent as an empty string. When `signal` aborts, the original
   * abort error is rethrown; other failures become
   * {@link TrelloCardCreationError}.
   *
   * @param parameters - List id, title, and optional description.
   * @param signal - Optional signal that aborts the in-flight request.
   * @returns Domain {@link TrelloCard} for the created card.
   * @throws {@link TrelloCardCreationError} when the create request fails.
   */
  async create(parameters: TrelloCreateCardParameters, signal?: AbortSignal): Promise<TrelloCard> {
    signal?.throwIfAborted()

    try {
      const payload = await this.client.request<TrelloCardResponse>('/cards', {
        method: HTTPMethod.POST,
        parameters: {
          desc: parameters.description ?? '',
          idList: parameters.listId,
          name: parameters.name,
        },
        signal,
      })

      return TrelloCard.from(payload)
    } catch (error) {
      if (signal?.aborted) {
        throw error
      }

      throw new TrelloCardCreationError({ cause: error })
    }
  }
}
