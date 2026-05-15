// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Optional context when constructing a {@link CubeSemanticModelCacheError}.
 */
export type CubeSemanticModelCacheErrorOptions = {
    /**
     * Original error or value (available as {@link Error.cause} on the thrown instance).
     */
    readonly cause?: unknown;
};

/**
 * Base class for all cache errors raised by the Cube semantic model
 * service. Mirrors the contract of {@link StorageError}, so callers can
 * react to cache failures without depending on a concrete backend.
 */
export abstract class CubeSemanticModelCacheError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of cache failure.
     */
    abstract readonly code: string;

    // MARK: - Constructor

    /**
     * Creates a new {@link CubeSemanticModelCacheError}.
     *
     * @param message - Human-readable error message describing the failure.
     * @param options - Optional cause for observability.
     */
    protected constructor(message: string, options?: CubeSemanticModelCacheErrorOptions) {
        const cause = options?.cause;
        super(message, cause !== undefined ? { cause } : undefined);
        this.name = new.target.name;
    }
}

/**
 * Error thrown when reading the cached Cube semantic model fails.
 *
 * This typically occurs when the underlying storage backend is
 * unavailable or the cached payload cannot be deserialized.
 */
export class CubeSemanticModelCacheReadError extends CubeSemanticModelCacheError {
    // MARK: - Properties

    /**
     * Machine-readable error code identifying cache read failures.
     */
    readonly code = 'CUBE_SEMANTIC_MODEL_CACHE_READ_FAILED';

    // MARK: - Constructor

    /**
     * Creates a new {@link CubeSemanticModelCacheReadError}.
     *
     * @param options - Optional cause for observability.
     */
    constructor(options?: CubeSemanticModelCacheErrorOptions) {
        super('Failed to read Cube semantic model cache', options);
    }
}

/**
 * Error thrown when persisting the Cube semantic model into the cache fails.
 *
 * This typically occurs when the underlying storage backend is
 * unavailable, a quota is exceeded, or the payload cannot be serialized.
 */
export class CubeSemanticModelCacheWriteError extends CubeSemanticModelCacheError {
    // MARK: - Properties

    /**
     * Machine-readable error code identifying cache write failures.
     */
    readonly code = 'CUBE_SEMANTIC_MODEL_CACHE_WRITE_FAILED';

    // MARK: - Constructor

    /**
     * Creates a new {@link CubeSemanticModelCacheWriteError}.
     *
     * @param options - Optional cause for observability.
     */
    constructor(options?: CubeSemanticModelCacheErrorOptions) {
        super('Failed to write Cube semantic model cache', options);
    }
}
