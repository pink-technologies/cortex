// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod';

/**
 * Schema for Cube filter operators.
 */
export const cubeFilterOperatorSchema = z.enum([
    'equals',
    'notEquals',
    'contains',
    'notContains',
    'startsWith',
    'notStartsWith',
    'endsWith',
    'notEndsWith',
    'gt',
    'gte',
    'lt',
    'lte',
    'set',
    'notSet',
    'inDateRange',
    'notInDateRange',
    'beforeDate',
    'beforeOrOnDate',
    'afterDate',
    'afterOrOnDate',
    'measureFilter',
]);

/**
 * Schema for Cube granularities.
 */
export const cubeGranularitySchema = z.enum([
    'second',
    'minute',
    'hour',
    'day',
    'week',
    'month',
    'quarter',
    'year',
]);

/**
 * Schema for Cube order.
 *
 * Example:
 * {
 *   "orders.total_revenue": "desc"
 * }
 */
export const cubeOrderSchema = z.enum(['asc', 'desc']);

/**
 * Schema for Cube filters.
 */
export const cubeFilterSchema = z.object({
    member: z.string(),
    operator: cubeFilterOperatorSchema,
    values: z.array(z.string()).optional(),
});

/**
 * Schema for Cube date ranges.
 *
 * Examples:
 * - "last week"
 * - ["2025-01-01", "2025-12-31"]
 * - ["2025-01-01"]
 */
export const cubeDateRangeSchema = z.union([
    z.string(),
    z.tuple([z.string(), z.string()]),
    z.array(z.string()).min(1).max(2),
]);

/**
 * Schema for Cube time dimensions.
 *
 * Note: `dateRange` is intentionally NOT supported here. Time-based filtering
 * is performed via {@link cubeFilterSchema} on numeric `year` / `month`
 * dimensions in this deployment. Keeping `dateRange` out of the schema means
 * the JSON Schema we advertise to the LLM is truthful: a single source of
 * truth, no runtime-only refinements to surprise the caller.
 */
export const cubeTimeDimensionSchema = z.object({
    dimension: z.string(),
    granularity: cubeGranularitySchema.optional(),
    compareDateRange: z.array(cubeDateRangeSchema).optional(),
});

/**
 * Schema for Cube query.
 */
export const cubeQuerySchema = z.object({
    measures: z.array(z.string()).optional(),
    dimensions: z.array(z.string()).optional(),
    filters: z.array(cubeFilterSchema).optional(),
    segments: z.array(z.string()).optional(),
    timeDimensions: z.array(cubeTimeDimensionSchema).optional(),
    order: z.record(z.string(), cubeOrderSchema).optional(),
    limit: z.number().int().positive().optional(),
});
