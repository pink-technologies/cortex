// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Rejects duplicate string entries within a Zod refinement context.
 *
 * Intended for use inside `.superRefine()` (or similar) when validating
 * identifier lists such as `capabilities`, `delegates_to`, or `skills`.
 * The first occurrence of each value is accepted; each later duplicate
 * reports a custom Zod issue at `[field, index]`.
 *
 * @param values - Collection of string values to check for uniqueness.
 * @param field - Field name used as the first segment of each issue path.
 * @param context - Zod refinement context that accumulates validation issues.
 */
export function validateUniqueValues(values: readonly string[], field: string, context: z.RefinementCtx): void {
  const encounteredValues = new Set<string>()

  values.forEach((value, index) => {
    if (encounteredValues.has(value)) {
      context.addIssue({
        code: 'custom',
        message: `Duplicate value: ${value}`,
        path: [field, index],
      })

      return
    }

    encounteredValues.add(value)
  })
}
