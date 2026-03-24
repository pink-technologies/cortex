// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile } from 'fs/promises';
import { basename, isAbsolute, join } from 'path';
import { parseToml } from '../parse/parse-toml';
import {
    BundledSchemas,
    type BundledPayload,
    bundledFilenames,
    isBundledFilename,
} from '../bundled';

/**
 * DI token for the application {@link BundledLoader}.
 * 
 */
export const BUNDLED_LOADER = Symbol('BUNDLED_LOADER');

/**
 * Loads and validates TOML bundles from the bundles.
 *
 * Implementations may read from disk, in-memory fixtures, or elsewhere.
 */
export interface BundledLoader {
    /**
     * Resolves a path against the bundle root: absolute paths are unchanged, relative paths are joined.
     *
     * @param filePath - Path relative to the bundle root or absolute.
     */
    resolvePath(filePath: string): string;

    /**
     * Reads a bundle file, parses TOML, and validates with the schema for its basename.
     *
     * @param filePath - Path relative to the bundle root or absolute.
     * @returns The validated bundle.
     */
    load(filePath: string): Promise<BundledPayload>;
}

/**
 * Filesystem-backed {@link BundledLoader}: reads `.toml` from disk under the configured root.
 *
 * Suitable for development, production bundles, or bootstrap-time loading from `BUNDLED_ROOT`.
 */
export class FsBundledLoader implements BundledLoader {
    // MARK: - Constructor

    /**
     * @param root - Root directory of bundles.
     */
    constructor(private readonly root: string) { }

    // MARK: - BundledLoader

    /**
     * Resolves a path against the bundle root: absolute paths are unchanged, relative paths are joined.
     *
     * @param filePath - Path relative to the bundle root or absolute.
     */
    resolvePath(filePath: string): string {
        return isAbsolute(filePath) ? filePath : join(this.root, filePath);
    }

    /**
     * Reads a bundle file, parses TOML, and validates with the schema for its basename.
     *
     * @param filePath - Path relative to the bundle root or absolute.
     * @returns The validated bundle.
     */
    async load(filePath: string): Promise<BundledPayload> {
        const absolute = this.resolvePath(filePath);
        const raw = await readFile(absolute, 'utf8');
        const parsed = parseToml(raw);
        const name = basename(absolute);

        if (!isBundledFilename(name)) {
            throw new Error(
                `Unsupported bundle file "${name}". Expected one of: ${bundledFilenames.join(', ')}`,
            );
        }

        return BundledSchemas[name].parse(parsed);
    }
}
