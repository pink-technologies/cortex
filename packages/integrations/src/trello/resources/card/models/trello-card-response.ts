// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Card payload as returned by Trello REST `POST /cards`.
 */
export interface TrelloCardResponse {
  /**
   * Unique identifier of the created card.
   */
  readonly id: string
}
