// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  RepositoryReviewJobResultSchema,
  type RepositoryReviewJobResult,
  type RepositoryReviewMode,
} from '@cortex/protocol'

/**
 * Extracts and validates a {@link RepositoryReviewJobResult} from engine output.
 *
 * Prefers a fenced ```json block when present; otherwise parses the entire
 * output as JSON.
 *
 * @param output - Textual output from the execution engine.
 * @param reviewMode - Review mode to apply when the engine omits it.
 * @returns The validated review result.
 */
export function mapRepositoryReviewResult(output: string, reviewMode: RepositoryReviewMode): RepositoryReviewJobResult {
  const jsonText = extractJson(output)
  let parsed: unknown

  try {
    parsed = JSON.parse(jsonText)
  } catch (error) {
    throw new Error('Review engine output was not valid JSON.', { cause: error })
  }

  if (parsed && typeof parsed === 'object' && !('reviewMode' in parsed)) {
    parsed = {
      ...parsed,
      reviewMode,
    }
  }

  return RepositoryReviewJobResultSchema.parse(parsed)
}

function extractJson(output: string): string {
  const fenced = output.match(/```(?:json)?\s*([\s\S]*?)```/i)

  if (fenced?.[1]) {
    return fenced[1].trim()
  }

  return output.trim()
}
