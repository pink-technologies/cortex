// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  RepositoryReviewJobResultSchema,
  type RepositoryReviewJobResult,
} from '@cortex/protocol'

/**
 * Extracts and validates a {@link RepositoryReviewJobResult} from engine output.
 *
 * Accepts raw JSON or a fenced ```json block. Nested Markdown code fences inside
 * JSON string values (common in architecture-depth finding details) must not
 * truncate extraction — the payload is located with a string-aware object scan.
 *
 * @param output - Textual output from the execution engine.
 * @returns The validated review result.
 */
export function mapRepositoryReviewResult(output: string): RepositoryReviewJobResult {
  const jsonText = extractJson(output)
  let parsed: unknown

  try {
    parsed = JSON.parse(jsonText)
  } catch (error) {
    throw new Error('Review engine output was not valid JSON.', { cause: error })
  }

  return RepositoryReviewJobResultSchema.parse(parsed)
}

/**
 * Returns the JSON object text from engine output.
 *
 * Prefer a top-level object scan over non-greedy fence matching so closing
 * fences embedded in finding `detail` strings do not truncate the payload.
 */
function extractJson(output: string): string {
  const trimmed = output.trim()

  if (trimmed.length === 0) {
    return trimmed
  }

  try {
    JSON.parse(trimmed)
    return trimmed
  } catch {
    // Continue with object extraction.
  }

  const objectText = extractBalancedJsonObject(trimmed)

  if (objectText !== undefined) {
    return objectText
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*)$/i)
  const fencedBody = fenceMatch?.[1]?.trim()

  if (fencedBody) {
    const fencedObject = extractBalancedJsonObject(fencedBody)

    if (fencedObject !== undefined) {
      return fencedObject
    }
  }

  return trimmed
}

/**
 * Extracts the first top-level `{ ... }` object, respecting JSON string escapes.
 *
 * @returns The object slice, or `undefined` when braces are unbalanced / missing.
 */
function extractBalancedJsonObject(text: string): string | undefined {
  const start = text.indexOf('{')

  if (start < 0) {
    return undefined
  }

  let depth = 0
  let inString = false
  let escaping = false

  for (let index = start; index < text.length; index += 1) {
    const character = text[index]

    if (inString) {
      if (escaping) {
        escaping = false
        continue
      }

      if (character === '\\') {
        escaping = true
        continue
      }

      if (character === '"') {
        inString = false
      }

      continue
    }

    if (character === '"') {
      inString = true
      continue
    }

    if (character === '{') {
      depth += 1
      continue
    }

    if (character === '}') {
      depth -= 1

      if (depth === 0) {
        return text.slice(start, index + 1)
      }
    }
  }

  return undefined
}
