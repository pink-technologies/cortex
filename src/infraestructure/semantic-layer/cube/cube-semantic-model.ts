// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { Cube, Meta } from '@cubejs-client/core';
import type {
    CubeSemanticCube,
    CubeSemanticModel,
} from '../types/cube';

/**
 * Builds a compact, LLM-oriented semantic model from the raw Cube
 * metadata payload.
 *
 * Cube's native {@link Meta} structure contains a large amount of
 * operational and UI-oriented metadata (folders, hierarchies,
 * drill members, formatting internals, visibility flags, etc.) that
 * is unnecessary for prompt-driven query generation.
 *
 * This projection reduces the payload to the minimum semantic surface
 * an LLM needs to:
 *
 * - discover available cubes/views
 * - identify valid measures, dimensions, and segments
 * - understand member meaning through titles/descriptions
 * - infer valid query composition
 * - prefer curated views over low-level cubes
 *
 * Projection rules:
 *
 * - Hidden entities are excluded (`public === false` or
 *   `isVisible === false`).
 * - Fully-qualified member names (`orders.total`) are localized to
 *   the cube scope (`total`) to reduce prompt token usage.
 * - Views are sorted before cubes so agents naturally prioritize
 *   curated analytical surfaces when both are available.
 * - Only lightweight JSON-safe primitives are emitted to keep the
 *   structure cache-friendly and serialization-safe.
 *
 * The function is intentionally pure:
 *
 * - no I/O
 * - no caching
 * - no framework dependencies
 * - no side effects
 *
 * This makes it deterministic, easy to unit test, and reusable across
 * cache warm-up flows, refresh paths, and future semantic-model
 * pipelines.
 *
 * @param meta - Raw semantic metadata returned by the Cube API.
 * @returns A compact semantic model optimized for LLM consumption.
 */
export function semanticModel(meta: Meta): CubeSemanticModel {
    return {
        cubes: meta.cubes
            .filter(isMemberVisible)
            .map(toSemanticCube)
            .sort(viewsFirst),
    };
}

/**
 * Projects a single Cube cube/view into its compact semantic
 * representation.
 *
 * The resulting structure intentionally keeps only the fields useful
 * for analytical reasoning and query construction.
 *
 * Measures and dimensions are normalized into a shared semantic-member
 * shape so prompt consumers can reason about them uniformly.
 *
 * @param cube - Raw Cube cube/view definition.
 * @returns Compact semantic representation of the cube/view.
 */
function toSemanticCube(cube: Cube): CubeSemanticCube {
    const localize = (memberName: string) =>
        stripCubePrefix(cube.name, memberName);

    return {
        name: cube.name,
        title: cube.title,
        type: cube.type ?? 'cube',
        description: cube.description,

        measures: cube.measures
            .filter(isMemberVisible)
            .map((measure) => ({
                name: localize(measure.name),
                title: measure.title,
                shortTitle: measure.shortTitle,
                type: measure.type,
                description: measure.description,
                format:
                    typeof measure.format === 'string'
                        ? measure.format
                        : undefined,
                currency: measure.currency,
            })),

        dimensions: cube.dimensions
            .filter(isMemberVisible)
            .map((dimension) => ({
                name: localize(dimension.name),
                title: dimension.title,
                shortTitle: dimension.shortTitle,
                type: dimension.type,
                description: dimension.description,
                format:
                    typeof dimension.format === 'string'
                        ? dimension.format
                        : undefined,
                currency: dimension.currency,
                primaryKey: dimension.primaryKey,
            })),

        segments: cube.segments
            .filter(isMemberVisible)
            .map((segment) => ({
                name: localize(segment.name),
                title: segment.title,
                shortTitle: segment.shortTitle,
            })),
    };
}

/**
 * Removes the `<cubeName>.` prefix from a fully-qualified member name.
 *
 * Example:
 *
 * `orders.total_revenue` → `total_revenue`
 *
 * Cube emits globally-qualified member identifiers, but prompt-driven
 * agents already operate within the context of the current cube.
 * Removing the prefix reduces token usage without losing semantic
 * meaning.
 *
 * @param cubeName - Owning cube name.
 * @param memberName - Fully-qualified member name.
 * @returns Localized member identifier.
 */
function stripCubePrefix(
    cubeName: string,
    memberName: string,
): string {
    const prefix = `${cubeName}.`;

    return memberName.startsWith(prefix)
        ? memberName.slice(prefix.length)
        : memberName;
}

/**
 * Determines whether a Cube entity should be exposed to prompt-driven
 * agents.
 *
 * Cube uses both `public` and `isVisible` flags to control metadata
 * visibility. Any entity explicitly hidden by either flag is excluded
 * from the projected semantic model.
 *
 * @param member - Cube metadata entity.
 * @returns `true` when the entity is safe to expose.
 */
function isMemberVisible(
    member: { public?: boolean; isVisible?: boolean },
): boolean {
    if (member.public === false) return false;
    if (member.isVisible === false) return false;

    return true;
}

/**
 * Sorting strategy that prioritizes semantic views over raw cubes.
 *
 * Views typically expose cleaner, curated analytical surfaces intended
 * for consumption, while raw cubes often contain lower-level or more
 * implementation-oriented structures.
 *
 * Prioritizing views increases the likelihood that prompt-driven agents
 * select higher-level analytical abstractions first.
 *
 * @param a - Left cube/view.
 * @param b - Right cube/view.
 * @returns Standard array sort ordering value.
 */
function viewsFirst(a: CubeSemanticCube, b: CubeSemanticCube): number {
    if (a.type === b.type) return 0;

    return a.type === 'view' ? -1 : 1;
}