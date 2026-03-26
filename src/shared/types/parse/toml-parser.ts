// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import * as TOML from '@iarna/toml';
import { Injectable } from '@nestjs/common';
import { ParserError } from './error/error';

/**
 * Interface for the TOML parser operation.
 */
interface Parser {
    /**
     * Parses a raw TOML string into a value of type `T` using the `@iarna/toml` library.
     *
     * @param raw - The TOML string to parse.
     * @returns The parsed value.
     */
    parser<T>(raw: string): T;
}

/**
 * Parses a raw TOML string into a value of type `T`.
 *
 * Uses the `@iarna/toml` library to parse the TOML string.
 */
@Injectable()
export class TomlParser implements Parser {
    // MARK: - Parse

    /**
     * Parses the raw TOML string into a value of type `T`.
     *
     * @param raw - The TOML string to parse.
     * @returns The parsed value.
     * @throws {@link ParserError} When the parse operation fails.
     */
    parser<T>(raw: string): T {
        try {
            return TOML.parse(raw) as T;
        } catch (error) {
            throw new ParserError(undefined, { cause: error });
        }
    }
}