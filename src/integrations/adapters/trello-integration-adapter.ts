// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
    IntegrationProvider,
    IntegrationProviderAdapter
} from "../domain/integration-provider.adapter";
import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    ServiceUnavailableException,
    UnauthorizedException,
} from "@nestjs/common";

/**
 * Credentials required to authenticate with the Trello REST API.
 */
interface TrelloIntegrationInput {
    /**
     * Trello API key (from the Power-Up / integration admin).
     */
    apiKey: string;

    /**
     * Trello token authorizing requests on behalf of the user whose token was issued.
     */
    token: string;
}

/**
 * {@link IntegrationProviderAdapter} for {@link IntegrationProvider.TRELLO}.
 *
 * Validates non-empty credential fields locally, then calls Trello's `members/me` endpoint.
 * Maps HTTP statuses to NestJS HTTP exceptions suitable for API responses.
 */
@Injectable()
export class TrelloIntegrationAdapter implements IntegrationProviderAdapter<TrelloIntegrationInput> {
    // MARK: - Properties

    /**
     * Integration kind this adapter handles.
     */
    readonly provider = IntegrationProvider.TRELLO;

    // MARK: - Instance methods

    /**
     * Verifies credentials by requesting the authenticated member (`GET /1/members/me`).
     *
     * @param input - Non-empty `apiKey` and `token` as required by {@link validateInput}.
     * @throws {UnauthorizedException} If Trello responds with `401` or `403`.
     * @throws {NotFoundException} If Trello responds with `404`.
     * @throws {ServiceUnavailableException} If Trello responds with `500`.
     * @throws {InternalServerErrorException} For any other unsuccessful response.
     */
    async testConnection(input: TrelloIntegrationInput): Promise<void> {
        const url = `https://api.trello.com/1/members/me?key=${input.apiKey}&token=${input.token}`;

        const response = await fetch(url, { method: "GET" })

        if (!response.ok) {
            this.handleTrelloError(response);
        }
    }

    /**
     * Ensures required credential fields are present before calling Trello.
     *
     * @param input - Raw integration payload.
     * @throws {Error} When `apiKey` or `token` is missing or empty.
     */
    validateInput(input: TrelloIntegrationInput): void {
        if (!input.apiKey) {
            throw new Error("API key is required");
        }

        if (!input.token) {
            throw new Error("Token is required");
        }
    }

    //  MARK: - Private methods

    private handleTrelloError(response: Response): never {
        if (response.status === 401 || response.status === 403) {
            throw new UnauthorizedException('Trello credentials are invalid');
        }

        if (response.status === 404) {
            throw new NotFoundException('Trello API key or token not found');
        }

        if (response.status === 500) {
            throw new ServiceUnavailableException('Trello is unavailable');
        }

        throw new InternalServerErrorException('Failed to test connection to Trello');
    }
}
