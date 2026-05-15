// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Top-level projection of the Cube semantic model exposed to prompt-driven agents
 * through the {@link CapabilityDescription.dynamicContext} property.
 */
export type CubeSemanticModel = {
    /**
     * The cubes of the semantic model.
     */
    cubes: CubeSemanticCube[];
};

/**
 * Envelope persisted in {@link STORAGE}. The TTL is owned by this
 * service rather than the storage adapter: we attach an absolute
 * expiration timestamp at write time and check it on read. This keeps
 * the shared {@link Storage} contract minimal (`read` / `write` /
 * `delete`) and contains the expiration policy inside the only consumer
 * that needs it.
 *
 * `expiresAt === null` represents a non-expiring entry (configured by
 * setting `CUBE_META_TTL_MS=0`).
 */
export interface CubeSemanticModelCacheEntry {
    /**
     * The expiration timestamp of the entry.
     */
    readonly expiresAt: number | null;

    /**
     * The projection of the Cube meta.
     */
    readonly semanticModel: CubeSemanticModel;
}

/**
 * Compact projection of one Cube segment.
 */
export type CubeSemanticSegment = {
    /**
     * The name of the segment.
     */
    name: string;

    /**
     * The title of the segment.
     */
    title: string;

    /**
     * The short title of the segment.
     */
    shortTitle: string;
};

/**
 * Compact projection of one Cube member (measure / dimension / segment).
 * Intentionally narrower than the upstream `TCubeMeasure` / `TCubeDimension`:
 * we expose only the fields a reasoning LLM needs to pick a member and
 * build a valid query, keeping the prompt payload small.
 */
export type CubeSemanticMember = {
    /**
     * The name of the semantic model.
     */
    name: string;

    /**
     * The title of the semantic model.
     */
    title: string;

    /**
     * The short title of the semantic model.
     */
    shortTitle: string;

    /**
     * The type of the semantic model.
     */
    type: string;

    /**
     * The description of the semantic model.
     */
    description?: string;

    /**
     * The format of the semantic model.
     */
    format?: string;

    /**
     * The currency of the semantic model.
     */
    currency?: string;

    /**
     * Whether the semantic model is a primary key.
     */
    primaryKey?: boolean;
};

/**
 * Compact projection of one Cube cube/view, scoped to the public surface
 * meaningful for query construction. Internal fields (folders, hierarchies,
 * connectedComponent, etc.) are intentionally omitted.
 */
export type CubeSemanticCube = {
    /**
     * The name of the cube.
     */
    name: string;

    /**
     * The title of the cube.
     */
    title: string;

    /**
     * The type of the cube.
     */
    type: 'view' | 'cube';

    /**
     * The description of the cube.
     */
    description?: string;

    /**
     * The measures of the cube.
     */
    measures: CubeSemanticMember[];

    /**
     * The dimensions of the cube.
     */
    dimensions: CubeSemanticMember[];

    /**
     * The segments of the cube.
     */
    segments: CubeSemanticSegment[];
};