// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IntegrationProvider } from "@prisma/client"

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