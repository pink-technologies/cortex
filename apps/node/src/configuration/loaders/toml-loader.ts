// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile } from 'node:fs/promises'
import { parse as parseToml } from '@iarna/toml'

/**
 * Maps a decoded TOML value into a typed result.
 *
 * Callers typically pass a Zod `parse` function or a thin wrapper around
 * `safeParse`.
 */
export type TomlRefinement<T> = (value: unknown) => T

/**
 * Thrown when a TOML file cannot be read or decoded into plain JavaScript data.
 */
export class TomlLoaderError extends Error {
  // MARK: - Constructor

  /**
   * Creates a TOML loader error.
   *
   * @param message - Human-readable failure summary without secret values.
   * @param options - Optional underlying cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = new.target.name
  }
}

/**
 * Loads TOML documents from disk into plain JavaScript values.
 *
 * `@iarna/toml` attaches Symbol metadata on nested tables. Those keys break
 * Zod record schemas, so loaded values are normalized to plain JSON data
 * before refinement.
 */
export class TomlLoader {
  // MARK: - Instance methods

  /**
   * Loads a TOML file from disk.
   *
   * @typeParam T - Output type when a refinement is provided.
   * @param filePath - Absolute path to the TOML file.
   * @param refine - Optional mapper from decoded `unknown` to `T`.
   * @returns Loaded value, or the refined typed result.
   * @throws {TomlLoaderError} When the file cannot be read or TOML is invalid.
   */
  async load(filePath: string): Promise<unknown>
  async load<T>(filePath: string, refine: TomlRefinement<T>): Promise<T>
  async load<T>(filePath: string, refine?: TomlRefinement<T>): Promise<T> {
    let raw: string

    try {
      raw = await readFile(filePath, 'utf8')
    } catch (error) {
      throw new TomlLoaderError(
        error instanceof Error ? `Failed to read TOML file: ${error.message}` : 'Failed to read TOML file.',
        { cause: error },
      )
    }

    let decoded: unknown

    try {
      decoded = JSON.parse(JSON.stringify(parseToml(raw)))
    } catch (error) {
      throw new TomlLoaderError(error instanceof Error ? `Malformed TOML: ${error.message}` : 'Malformed TOML.', {
        cause: error,
      })
    }

    return refine ? refine(decoded) : (decoded as T)
  }
}
