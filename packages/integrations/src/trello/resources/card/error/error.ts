// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationsError } from '../../../../error/error'

/**
 * Thrown when a Trello card cannot be created.
 *
 * Raised by {@link TrelloCardResource.create} when the request fails. The
 * underlying networking failure is preserved in {@link Error.cause}.
 */
export class TrelloCardCreationError extends IntegrationsError {
  // MARK: - Properties

  /**
   * Machine-readable code for Trello card creation failures.
   */
  readonly code = 'TRELLO_CARD_CREATION_ERROR'

  // MARK: - Constructor

  /**
   * Creates an error describing a failed Trello card create.
   *
   * @param options - Optional error details, including the original cause.
   */
  constructor(options?: ErrorOptions) {
    super('Failed to create Trello card', options)
  }
}
