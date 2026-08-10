// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * Absolute URL string with trailing slashes removed after validation.
 *
 * Used for API bases, Jira Cloud bases, and repository clone URLs so callers
 * can concatenate path segments without worrying about duplicate slashes.
 */
export const UrlWithoutTrailingSlashSchema = z
  .string()
  .trim()
  .pipe(z.url())
  .transform((value) => value.replace(/\/+$/, ''))
