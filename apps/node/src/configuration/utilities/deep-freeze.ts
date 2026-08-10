// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Deep-freezes a plain configuration value tree.
 *
 * Freezes the root and every nested plain object and array. Does not attempt to
 * freeze class instances, functions, or built-in exotic objects.
 *
 * @param value - Value to freeze in place.
 * @returns The same value after freezing.
 */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Object.isFrozen(value)) {
    return value
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      deepFreeze(entry)
    }

    return Object.freeze(value)
  }

  for (const nested of Object.values(value)) {
    deepFreeze(nested)
  }

  return Object.freeze(value)
}
