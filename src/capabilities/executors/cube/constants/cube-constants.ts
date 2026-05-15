// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Summary of the Cube analytics capability.
 */
export const CUBE_SUMMARY = `
  Read-only analytical access to the Cube semantic layer.
  Use the \`load\` action to run a query against the cubes / views
  listed in \`dynamicContext.cubes\`. Always reference members by
  their fully qualified name (\`<cubeName>.<memberName>\`).
`.trim();

/**
 * Description of the `load` action for the Cube analytics capability.
 */
export const CUBE_LOAD_DESCRIPTION = `
  Execute one analytical query against the Cube semantic layer
  and return the resulting rows. Validated against the JSON Schema
  below; unknown fields will be ignored.
`.trim();

/** 
 * Rules for the `load` action for the Cube analytics capability.
 */
export const CUBE_LOAD_RULES = [
    `IDENTIFIER FORMAT: Every member reference (in \`measures\`, \`dimensions\`, \`filters[].member\`, \`order\` keys) 
     MUST be the EXACT string \`<cube.name>.<member.name>\`, where \`cube.name\` comes from \`dynamicContext.cubes[].name\` 
     and \`member.name\` comes from that cube's \`measures[].name\` or \`dimensions[].name\`. 
     The \`member.name\` is ALREADY a short identifier (e.g. \`total_revenue\`); never prepend the cube name a second time.`,

    `MEASURES vs DIMENSIONS: \`measures\` is for aggregations only (sums, counts, averages — values listed under \`cubes[].measures\`). 
     \`dimensions\` is for grouping keys (ids, names, time buckets — values listed under \`cubes[].dimensions\`). 
     A dimension MUST NEVER appear in \`measures\` and vice versa.`,

    `VIEWS FIRST: When \`dynamicContext.cubes\` exposes both a \`view\` and a \`cube\` for the same domain, always pick the view.`,

    `DATE FILTERING: Filter by date using \`filters\` on numeric dimensions such as \`year\` and \`month\` 
     (values as strings, e.g. \`"2025"\`). Do NOT add a \`dateRange\` field inside \`timeDimensions\`.`,

    `LIMIT: Always set a \`limit\` (default 10) to avoid pulling unbounded result sets.`,
].join('\n').trim();