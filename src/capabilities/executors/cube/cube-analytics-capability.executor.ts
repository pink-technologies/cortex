// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';
import type { Query } from '@cubejs-client/core';
import { Injectable } from '@nestjs/common';
import {
    CubeSemanticLayerApiClient,
    CubeSemanticModelService,
} from '@/infraestructure/semantic-layer';
import { cubeQuerySchema } from '@/capabilities/schema/cube/cube-query.schema';
import { ExecutionContext } from '@/shared/types/context/execution-context';
import { CapabilityExecutor } from '../capability-executor';
import { CapabilityContractProvider } from '@/capabilities/capability';
import {
    type CapabilityAction,
    type CapabilityDescription,
} from '@/capabilities/capability';
import {
    CUBE_LOAD_DESCRIPTION,
    CUBE_LOAD_RULES,
    CUBE_SUMMARY,
} from './constants/cube-constants';

/**
 * Query for the Cube analytics capability.
 */
export type CubeAnalyticsQuery = Query;

/**
 * Response for the Cube analytics capability.
 */
export type CubeAnalyticsResponse = {
    /**
     * The data returned by Cube for the executed query.
     */
    data: Record<string, unknown>[];

    /**
     * The query that Cube actually executed (echoed back).
     */
    query: Query;
};

/**
 * Executor for the Cube analytics capability.
 *
 * Implements both {@link CapabilityExecutor} (runs a single `load` against
 * Cube) and {@link CapabilityContractProvider} (advertises the live projection
 * to prompt-driven agents). The describer keeps the agent's `prompt.md` free
 * of hardcoded measures/dimensions: when the projection in Cube changes, only
 * the live meta is updated, not the prompt.
 *
 * Meta retrieval is fully delegated to {@link CubeSemanticModelService}, which owns
 * the cache-aside semantics and the boot-time warm-up. The executor stays
 * focused on two concerns: validating input and forwarding it to Cube.
 */
@Injectable()
export class CubeAnalyticsCapabilityExecutor
    implements
    CapabilityExecutor<CubeAnalyticsQuery, CubeAnalyticsResponse>,
    CapabilityContractProvider {
    // MARK: - Properties

    /**
     * The id of the capability. Shared between the executor and the contract provider
     * so a single class satisfies both ports.
     */
    readonly id: string = 'cube-analytics';

    // MARK: - Constructor

    /**
     * Creates a new Cube analytics capability executor.
     *
     * @param cubeClient - Cube REST client used to run `load` queries.
     * @param metaService - Cache-aware accessor for the projected Cube
     *   semantic model used by {@link describe}.
     */
    constructor(
        private readonly cubeClient: CubeSemanticLayerApiClient,
        private readonly metaService: CubeSemanticModelService,
    ) { }

    // MARK: - CapabilityExecutor

    /**
     * Executes the Cube analytics capability.
     *
     * Validates the input against {@link cubeQuerySchema} and forwards it to
     * Cube's `load` endpoint. Does NOT fetch the semantic model on this path:
     * prompts are built using {@link describe}, which is responsible for
     * surfacing the live contract to the agent.
     *
     * @param input - The Cube query to execute. The input IS the query (no
     *   wrapper), matching the JSON Schema advertised by {@link describe}.
     * @returns The normalized query Cube executed plus the resulting rows.
     */
    async execute(input: CubeAnalyticsQuery, _context: ExecutionContext): Promise<CubeAnalyticsResponse> {
        const parsedQuery = cubeQuerySchema.parse(input) as Query;
        const result = await this.cubeClient.executeQuery(parsedQuery);

        return {
            data: result.data,
            query: result.query,
        };
    }

    /**
     * Produces a live {@link CapabilityDescription} for the agent prompt.
     *
     * The {@link CapabilityDescription.runtimeContext} payload is built from
     * the cached Cube projection (see {@link CubeSemanticModelService}), so the LLM
     * sees the same set of measures, dimensions and segments that exist in
     * Cube right now without paying a network round-trip on every turn.
     *
     * @returns The capability description, ready to be serialized into a prompt.
     */
    async describe(_context: ExecutionContext): Promise<CapabilityDescription> {
        const projection = await this.metaService.getSemanticModel();

        return {
            id: this.id,
            summary: CUBE_SUMMARY,
            actions: [
                this.buildLoadAction()
            ],
            runtimeContext: projection,
        };
    }

    // MARK: - Private methods

    private buildLoadAction(): CapabilityAction {
        return {
            name: 'load',
            description: CUBE_LOAD_DESCRIPTION,
            inputSchema: cubeQuerySchema,
            rules: CUBE_LOAD_RULES.split('\n'),
        };
    }
}
