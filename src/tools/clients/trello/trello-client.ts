// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Trello client.
 */
export class TrelloClient {
    // MARK: - Private properties

    private readonly baseUrl = 'https://api.trello.com';

    // MARK: - Constructor

    /**
     * Creates a new Trello client.
     *
     * @param apiKey - The API key.
     * @param token - The token.
     */
    constructor(
        private readonly apiKey: string,
        private readonly token: string,
    ) { }

    /**
     * Builds a URL for the given path and query parameters.
     *
     * @param path - The path to the resource.
     * @param query - The query parameters.
     * @returns The URL.
     */
    buildUrl(path: string, query?: Record<string, string>): string {
        const parameters = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            ...query,
        });

        return `${this.baseUrl}${path}?${parameters.toString()}`;
    }
}