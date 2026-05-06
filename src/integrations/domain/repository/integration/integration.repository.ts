// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common";
import { type IntegrationProvider } from "@prisma/client";
import {
    Database,
    type Integration,
} from "@/infraestructure/database";

/**
 * Repository responsible for persisting and querying integration entities.
 */
@Injectable()
export class IntegrationRepository {
    // MARK: - Constructor

    /**
     * Creates a new {@link IntegrationRepository}.
     *
     * @param database - The database client used to perform integration operations.
     * Injected at runtime to support inversion of control and enable testability.
     */
    constructor(private readonly database: Database) { }

    // MARK: - Instance methods

    /**
     * Creates a new integration.
     *
     * @param provider - The provider of the integration.
     * @returns The created integration entity.
     */
    async create(provider: IntegrationProvider): Promise<Integration> {
        return this.database.integration.create({ data: { provider } })
    }
}