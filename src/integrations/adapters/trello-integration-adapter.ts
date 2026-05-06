// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationProvider } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { IntegrationProviderAdapter } from "../domain/integration-provider.adapter";

/**
 * Input for the Trello integration.
 */
interface TrelloIntegrationInput {
    /**
     * The API key for the Trello integration.
     */
    apiKey: string;

    /**
     * The token for the Trello integration.
     */
    token: string;
}

/**
 * Adapter for the Trello integration.
 */
@Injectable()
export class TrelloIntegrationAdapter implements IntegrationProviderAdapter<TrelloIntegrationInput> {
    // MARK: - Properties

    /**
     * The provider of the integration.
     */
    readonly provider = IntegrationProvider.TRELLO;

    // MARK: - Instance methods

    /**
     * Tests the connection to the Trello integration.
     *
     * @param input - The input to test the connection with.
     * @returns The result of the connection test.
     */
    async testConnection(input: TrelloIntegrationInput): Promise<void> {
        const url = `https://api.trello.com/1/members/me?key=${input.apiKey}&token=${input.token}`;

        const response = await fetch(url, { method: "GET" })

        if (!response.ok) {
            throw new Error(`Failed to test connection to Trello: ${response.statusText}`);
        }

        const data = await response.json();

        console.log(data);
    }

    /**
     * Validates the input.
     *
     * @param input - The input to validate.
     * @returns The result of the validation.
     */
    validateInput(input: TrelloIntegrationInput): void {
        if (!input.apiKey) {
            throw new Error("API key is required");
        }

        if (!input.token) {
            throw new Error("Token is required");
        }
    }
}
