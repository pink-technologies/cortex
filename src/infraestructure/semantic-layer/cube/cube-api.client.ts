// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { CubeSemanticLayer } from '../cube-semantic-layer';
import {
    CubeApi,
    RequestError,
    type Meta,
    type Query,
} from '@cubejs-client/core';

import {
    CubeSemanticLayerLoadRequestError,
    CubeSemanticLayerMetaRequestError,
    CubeSemanticLayerRequestError,
    type CubeSemanticLayerErrorOptions,
} from '../error/cube-error';

/**
 * Result of a Cube query.
 */
export type CubeQueryResult = {
    /**
     * The query executed.
     */
    query: Query;

    /**
     * The data returned from the query.
     */
    data: Record<string, unknown>[];
};

/**
 * Client for the Cube semantic layer API.
 */
export class CubeSemanticLayerApiClient implements CubeSemanticLayer<Meta, Query, CubeQueryResult> {
    // MARK: - Private properties

    private readonly client: CubeApi;

    // MARK: - Constructor

    /**
     * Creates a new {@link CubeSemanticLayerApiClient} instance.
     *
     * @param apiUrl
     * Base Cube REST API URL.
     *
     * Example:
     * `https://your-instance.cubecloudapp.dev/cubejs-api/v1`
     *
     * @param apiToken
     * JWT or secret token used for authentication.
     *
     * If the token does not include the `Bearer` prefix,
     * it will be added automatically.
     *
     * @throws {@link CubeSemanticLayerRequestError}
     * Thrown when:
     * - `apiUrl` is empty
     * - `apiToken` is empty
     */
    constructor(apiUrl: string, apiToken: string) {
        const base = apiUrl.trim().replace(/\/$/, '');
        const raw = apiToken.trim();

        if (!base) {
            throw new CubeSemanticLayerRequestError({
                cause: new Error(
                    'The API URL is required (set CUBEJS_API_URL).',
                ),
            });
        }

        if (!raw) {
            throw new CubeSemanticLayerRequestError({
                cause: new Error(
                    'The API token is required (set CUBEJS_API_TOKEN).',
                ),
            });
        }

        const authorization = raw.toLowerCase().startsWith('bearer ')
            ? raw
            : `Bearer ${raw}`;

        this.client = new CubeApi({
            apiUrl: base,
            headers: { Authorization: authorization },
            fetchTimeout: 60_000,
        });
    }

    // MARK: - Methods

    /**
     * Retrieves the semantic model metadata configured in Cube.
     *
     * Returns metadata related to:
     * - Cubes
     * - Views
     * - Measures
     * - Dimensions
     * - Time dimensions
     * - Joins and relationships 
     *
     * @returns Promise containing the semantic layer metadata.
     */
    async fetchMeta(): Promise<Meta> {
        try {
            const meta = await this.client.meta();

            return meta;
        } catch (error) {
            throw new CubeSemanticLayerMetaRequestError(this.mapToLayerErrorOptions(error));
        }
    }

    /**
     * Executes an analytical query against Cube.
     *
     * @param query
     * Cube query object (`Query`) that may include:
     * - measures
     * - dimensions
     * - filters
     * - segments
     * - timeDimensions
     * - order
     * - limit
     *
     * @returns Normalized query result containing:
     * - query: executed query
     * - data: returned rows
     * - annotation: column metadata
     *
     * @example
     * ```ts
     * const result = await client.executeQuery({
     *   measures: ['Orders.totalRevenue'],
     *   timeDimensions: [
     *     {
     *       dimension: 'Orders.createdAt',
     *       granularity: 'month'
     *     }
     *   ]
     * });
     * ```
     *
     * @throws {@link CubeSemanticLayerLoadRequestError}
     */
    async executeQuery(query: Query): Promise<CubeQueryResult> {
        try {
            const result = await this.client.load(query);

            return {
                query: result.query(),
                data: result.rawData()
            };
        } catch (error) {
            throw new CubeSemanticLayerLoadRequestError(this.mapToLayerErrorOptions(error))
        }
    }

    // MARK: - Private methods

    private mapToLayerErrorOptions(error: unknown): CubeSemanticLayerErrorOptions {
        if (error instanceof RequestError) {
            return {
                cause: error,
                httpStatus: error.status,
                httpResponse: error.response,
            }
        }
        return { cause: error }
    }

}
