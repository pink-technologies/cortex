// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Inputs for {@link TrelloCardResource.create}.
 *
 * Identifies the destination list and the card title, with an optional
 * description. Board placement is implied by `listId`; callers do not pass a
 * board id here.
 */
export interface TrelloCreateCardParameters {
  /**
   * Description shown on the new card.
   *
   * When omitted, {@link TrelloCardResource.create} sends an empty description.
   */
  readonly description?: string

  /**
   * Trello list id that receives the new card.
   *
   * Must be a list id from the Trello API (for example from a board's lists),
   * not a board id or card id.
   */
  readonly listId: string

  /**
   * Title shown on the new card.
   */
  readonly name: string
}
