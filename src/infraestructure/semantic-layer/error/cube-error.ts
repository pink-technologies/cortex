// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Optional context when constructing a {@link CubeSemanticLayerError}.
 */
export type CubeSemanticLayerErrorOptions = {
    /**
     * Original error or value (available as {@link Error.cause} on the thrown instance).
     */
    readonly cause?: unknown;

    /**
     * HTTP status from Cube when the failure came from the REST transport.
     */
    readonly httpStatus?: number;

    /**
     * Parsed response body or error payload from Cube (shape depends on endpoint).
     */
    readonly httpResponse?: unknown;
};

/**
 * Base class for all cube semantic layer errors.
 */
export abstract class CubeSemanticLayerError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * cube semantic layer error.
     */
    abstract readonly code: string;

    /**
     * HTTP status from Cube when applicable (e.g. from the SDK `RequestError`).
     */
    readonly httpStatus?: number;

    /**
     * Response body or error payload from Cube when applicable.
     */
    readonly httpResponse?: unknown;

    // MARK: - Constructor

    /**
     * Creates a new {@link CubeSemanticLayerError}.
     *
     * @param message - The human-readable error message describing the failure.
     * @param options - Optional cause, HTTP status, and response for observability.
     */
    protected constructor(message: string, options?: CubeSemanticLayerErrorOptions) {
        const cause = options?.cause;
        super(message, cause !== undefined ? { cause } : undefined);

        this.httpStatus = options?.httpStatus;
        this.httpResponse = options?.httpResponse;
        this.name = new.target.name;
    }
}

/**
 * Error thrown when a cube semantic layer meta request fails.
 */
export class CubeSemanticLayerMetaRequestError extends CubeSemanticLayerError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying cube semantic layer meta request errors.
     */
    readonly code = 'CUBE_SEMANTIC_LAYER_META_REQUEST_ERROR';

    // MARK: - Constructor

    /**
     * Creates a new {@link CubeSemanticLayerMetaRequestError}.
     *
     * @param options - Optional cause, HTTP status, and response from Cube.
     */
    constructor(options?: CubeSemanticLayerErrorOptions) {
        super('Failed to request cube semantic layer meta data', options);
    }
}

/**
 * Error thrown when a cube semantic layer load request fails.
 */
export class CubeSemanticLayerLoadRequestError extends CubeSemanticLayerError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying cube semantic layer load request errors.
     */
    readonly code = 'CUBE_SEMANTIC_LAYER_LOAD_REQUEST_ERROR';

    // MARK: - Constructor

    /**
     * Creates a new {@link CubeSemanticLayerLoadRequestError}.
     *
     * @param options - Optional cause, HTTP status, and response from Cube.
     */
    constructor(options?: CubeSemanticLayerErrorOptions) {
        super('Failed to request cube semantic layer load data', options);
    }
}

/**
 * Error thrown for configuration or generic cube semantic layer failures.
 */
export class CubeSemanticLayerRequestError extends CubeSemanticLayerError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying cube semantic layer request errors.
     */
    readonly code = 'CUBE_SEMANTIC_LAYER_REQUEST_ERROR';

    // MARK: - Constructor

    /**
     * Creates a new {@link CubeSemanticLayerRequestError}.
     *
     * @param options - Optional cause, HTTP status, and response from Cube.
     */
    constructor(options?: CubeSemanticLayerErrorOptions) {
        super('Failed to request cube semantic layer data', options);
    }
}
