// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { WorkflowRunFailureCode } from '../datatypes'
import type { WorkflowRunFailure } from '../models/workflow-run-failure'

/**
 * Maximum characters retained for {@link WorkflowRunFailure.message}.
 */
const MaxFailureMessageLength = 500

/**
 * Maximum UTF-16 code units retained when serializing failure details.
 */
const MaxFailureDetailsJsonLength = 4_096

/**
 * Property names stripped from failure detail objects before persistence.
 */
const RedactedDetailKeys = new Set(['authorization', 'cookie', 'password', 'secret', 'stack', 'token'])

/**
 * Builds a bounded, public {@link WorkflowRunFailure} from an untrusted source.
 *
 * Accepts job failure payloads, approval rejection records, or free-form
 * values. Always returns a concrete `{ code, message }` shape; optional
 * `details` are redacted and size-capped. Defaults to
 * {@link WorkflowRunFailureCode.JOB_FAILED} when no code is present.
 *
 * @param source - Untrusted failure value (typically a job `failure` column).
 * @returns Sanitized failure safe to persist on a workflow run.
 */
export function sanitizeWorkflowRunFailure(source: unknown): WorkflowRunFailure {
  if (source == null) {
    return {
      code: WorkflowRunFailureCode.JOB_FAILED,
      message: 'Execution job failed',
    }
  }

  if (typeof source === 'string') {
    return {
      code: WorkflowRunFailureCode.JOB_FAILED,
      message: truncate(source, MaxFailureMessageLength),
    }
  }

  if (typeof source !== 'object' || Array.isArray(source)) {
    return {
      code: WorkflowRunFailureCode.JOB_FAILED,
      message: 'Execution job failed',
      details: boundJsonValue(source),
    }
  }

  const record = source as Record<string, unknown>
  const code =
    typeof record.code === 'string' && record.code.trim().length > 0
      ? truncate(record.code.trim(), 128)
      : WorkflowRunFailureCode.JOB_FAILED

  const message =
    typeof record.message === 'string' && record.message.trim().length > 0
      ? truncate(record.message.trim(), MaxFailureMessageLength)
      : 'Execution job failed'

  const detailsSource = record.details !== undefined ? record.details : omitKeys(record, ['code', 'message'])
  const details = boundJsonValue(redactSensitiveKeys(detailsSource))

  if (details === undefined) {
    return { code, message }
  }

  return { code, message, details }
}

function omitKeys(value: Record<string, unknown>, keys: readonly string[]): unknown {
  const omitted = new Set(keys)
  const result: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(value)) {
    if (!omitted.has(key)) {
      result[key] = entry
    }
  }

  return Object.keys(result).length === 0 ? undefined : result
}

function redactSensitiveKeys(value: unknown): unknown {
  if (value == null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveKeys(entry))
  }

  const result: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (RedactedDetailKeys.has(key.toLowerCase())) {
      continue
    }

    result[key] = redactSensitiveKeys(entry)
  }

  return result
}

function boundJsonValue(value: unknown): unknown | undefined {
  if (value === undefined) {
    return undefined
  }

  try {
    const serialized = JSON.stringify(value)

    if (serialized === undefined) {
      return undefined
    }

    if (serialized.length <= MaxFailureDetailsJsonLength) {
      return JSON.parse(serialized) as unknown
    }

    return {
      truncated: true,
      preview: truncate(serialized, MaxFailureDetailsJsonLength),
    }
  } catch {
    return undefined
  }
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1)}…`
}
