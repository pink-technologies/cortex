// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { HTTPMethod } from '@cortex/networking';
import { TrelloClient } from '../../src/trello';

describe('TrelloClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves relative paths and merges key/token into parameters', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'card-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = new TrelloClient('api-key', 'user-token');
    const payload = await client.request<{ id: string }>('/cards', {
      method: HTTPMethod.POST,
      parameters: {
        idList: 'list-1',
        name: 'Ship it',
      },
    });

    expect(payload).toEqual({ id: 'card-1' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.trello.com/1/cards');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: HTTPMethod.POST,
    });

    const body = String(fetchMock.mock.calls[0]?.[1]?.body ?? '');
    expect(body).toContain('key=api-key');
    expect(body).toContain('token=user-token');
    expect(body).toContain('idList=list-1');
    expect(body).toContain('name=Ship+it');
  });

  it('normalizes paths without a leading slash', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = new TrelloClient('k', 't');
    await client.request('cards');

    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(
      /^https:\/\/api\.trello\.com\/1\/cards\?/,
    );
  });

  it('throws when the response fails validation', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('missing', { status: 404 }));

    const client = new TrelloClient('k', 't');

    await expect(client.request('/cards')).rejects.toBeDefined();
  });
});
