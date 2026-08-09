// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { TrelloCardCreationError } from '../../../../../src/trello';

describe('TrelloCardCreationError', () => {
  it('stores code and cause', () => {
    const cause = new Error('transport');
    const error = new TrelloCardCreationError({ cause });

    expect(error.name).toBe('TrelloCardCreationError');
    expect(error.code).toBe('TRELLO_CARD_CREATION_ERROR');
    expect(error.message).toContain('create');
    expect(error.cause).toBe(cause);
  });
});
