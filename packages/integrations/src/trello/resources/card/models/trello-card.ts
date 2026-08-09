// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { TrelloCardResponse } from './trello-card-response'

/**
 * Card fields needed by Trello tools.
 *
 * Domain model mapped from Trello REST payloads. Wire shapes stay in
 * {@link TrelloCardResponse}; use {@link TrelloCard.from} to convert them.
 */
export class TrelloCard {
  // MARK: - Properties

  /**
   * Unique identifier of the card.
   */
  readonly id: string

  // MARK: - Static methods

  /**
   * Maps a transport-layer card response into a domain card.
   *
   * @param response - Decoded payload from a cards endpoint.
   * @returns Domain card ready for tools.
   */
  static from(response: TrelloCardResponse): TrelloCard {
    return new TrelloCard(response.id)
  }

  // MARK: - Constructor

  /**
   * Creates a domain Trello card.
   *
   * @param id - Unique identifier of the card.
   */
  constructor(id: string) {
    this.id = id
  }
}
