// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Interface for the Cube semantic layer.
 *
 * @typeParam Meta - The type of the semantic model metadata.
 * @typeParam Query - The type of the query to execute.
 */
export interface CubeSemanticLayer<
    TMeta = unknown,
    TCubeQuery = unknown,
    TResult = unknown,
> {
    /**
     * Fetches the semantic model metadata configured in Cube.
     *
     * @returns The semantic model metadata.
     */
    fetchMeta(): Promise<TMeta>;

    /**
     * Executes an analytical query against Cube.
     *
     * @param query - The query to execute.
     * @returns The query result.
     */
    executeQuery(query: TCubeQuery): Promise<TResult>;
}
