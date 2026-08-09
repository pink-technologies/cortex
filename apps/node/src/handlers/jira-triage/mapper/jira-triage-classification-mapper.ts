// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  JiraTriageClassificationSchema,
  type JiraTriageClassification,
} from '@cortex/protocol'

/**
 * Extracts a JSON object from engine output that may include markdown fences.
 */
export function extractJsonObject(output: string): unknown {
  const trimmed = output.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() ?? trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')

  if (start === -1 || end === -1 || end < start) {
    throw new Error('Engine output did not contain a JSON object.')
  }

  return JSON.parse(candidate.slice(start, end + 1))
}

/**
 * Parses and validates triage classification JSON from engine output.
 */
export function mapJiraTriageClassification(output: string): JiraTriageClassification {
  const parsed = extractJsonObject(output)
  return JiraTriageClassificationSchema.parse(parsed)
}
