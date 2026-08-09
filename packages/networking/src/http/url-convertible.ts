// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NetworkingInvalidURLError } from '../error/error'

/**
 * Values that can be resolved into an absolute URL string.
 */
export type URLConvertible = string | URL

/**
 * Resolves a {@link URLConvertible} into a validated absolute URL string.
 *
 * @param value - String or {@link URL} to convert.
 * @returns Absolute URL string.
 * @throws {@link NetworkingInvalidURLError} when the value is not a valid absolute URL.
 */
export function resolveURL(value: URLConvertible): string {
  if (value instanceof URL) {
    return value.href
  }

  try {
    return new URL(value).href
  } catch (cause) {
    throw new NetworkingInvalidURLError(`Invalid URL: ${value}`, { cause })
  }
}
