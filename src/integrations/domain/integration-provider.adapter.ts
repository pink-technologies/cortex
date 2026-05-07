// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * The provider of the integration.
 */
export enum IntegrationProvider {
    /**
     * The Trello provider.
     */
    TRELLO = "TRELLO",

    /**
     * The Quality provider.
     */
    QUALITY = "QUALITY",

    /**
     * The unknown provider.
     */
    UNKNOWN = "UNKNOWN",
}

/**
 * Adapter responsible for integrating with a specific integration provider.
 */
export interface IntegrationProviderAdapter<TInput = unknown> {
    // MARK: - Properties

    /**
     * The provider of the integration.
     */
    readonly provider: IntegrationProvider

    // MARK: - Instance methods

    /**
     * Tests the connection to the integration provider.
     *
     * @param input - The input to test the connection with.
     * @returns The result of the connection test.
     */
    testConnection(input: TInput): Promise<void>

    /**
     * Validates the input.
     *
     * @param input - The input to validate.
     * @returns The result of the validation.
     */
    validateInput(input: TInput): void
}