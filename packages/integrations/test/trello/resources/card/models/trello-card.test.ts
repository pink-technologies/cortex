// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { TrelloCard } from '../../../../../src/trello';

describe('TrelloCard', () => {
  it('maps a wire response via from()', () => {
    const card = TrelloCard.from({ id: 'card-1' });

    expect(card.id).toBe('card-1');
  });
});
