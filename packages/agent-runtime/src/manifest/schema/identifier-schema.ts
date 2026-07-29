// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Validates stable identifiers used across agent manifests.
 *
 * Accepted form: one or more lowercase alphanumeric segments separated by
 * `.`, `_`, or `-` (for example `main`, `research.summarize`, `trello-cards`).
 * Leading/trailing separators and uppercase letters are rejected.
 *
 * Used for agent `id` values and for entries in `capabilities`,
 * `delegates_to`, and `skills`.
 */
export const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
    'Expected a lowercase identifier containing letters, numbers, dots, underscores, or hyphens',
  )