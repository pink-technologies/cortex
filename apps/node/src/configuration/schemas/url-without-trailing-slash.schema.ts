// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { z } from 'zod'

/**
 * URL string with trailing slashes removed after validation.
 */
export const UrlWithoutTrailingSlashSchema = z
  .string()
  .trim()
  .pipe(z.url())
  .transform((value) => value.replace(/\/+$/, ''))
