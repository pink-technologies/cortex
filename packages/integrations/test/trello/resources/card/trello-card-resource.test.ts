// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { TrelloCardResource, TrelloClient } from '../../../../src/trello';

describe('TrelloCardResource', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function resource(): TrelloCardResource {
    return new TrelloCardResource(new TrelloClient('api-key', 'user-token'));
  }

  it('creates a card and returns the domain model', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'card-1', name: 'Ship it' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const card = await resource().create({
      description: 'Details',
      listId: 'list-1',
      name: 'Ship it',
    });

    expect(card.id).toBe('card-1');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.trello.com/1/cards');
    expect(String(fetchMock.mock.calls[0]?.[1]?.body ?? '')).toContain('idList=list-1');
  });

  it('defaults description to an empty string', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'card-2' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await resource().create({
      listId: 'list-1',
      name: 'Untitled',
    });

    expect(String(fetchMock.mock.calls[0]?.[1]?.body ?? '')).toContain('desc=');
  });

  it('throws TrelloCardCreationError when create fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('boom', { status: 500 }));

    await expect(
      resource().create({
        listId: 'list-1',
        name: 'Ship it',
      }),
    ).rejects.toMatchObject({
      code: 'TRELLO_CARD_CREATION_ERROR',
      name: 'TrelloCardCreationError',
    });
  });

  it('rethrows cancellation without wrapping', async () => {
    const controller = new AbortController();

    jest.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) {
          reject(new Error('missing signal'));
          return;
        }

        signal.addEventListener('abort', () => {
          reject(signal.reason ?? new Error('aborted'));
        });
      });
    });

    const pending = resource().create(
      {
        listId: 'list-1',
        name: 'Ship it',
      },
      controller.signal,
    );
    controller.abort();

    await expect(pending).rejects.not.toMatchObject({
      code: 'TRELLO_CARD_CREATION_ERROR',
    });
  });
});
