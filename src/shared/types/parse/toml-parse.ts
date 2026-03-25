// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import * as TOML from '@iarna/toml';
import { Injectable } from '@nestjs/common';
import { TomlParseError } from './error/error';

/**
 * Interface for the TOML parse operation.
 */
interface Parse {
    /**
     * Parses a raw TOML string into a value of type `T`.
     *
     * @param raw - The TOML string to parse.
     * @returns The parsed value.
     */
    parse<T>(raw: string): T;
}

/**
 * Parses a raw TOML string into a value of type `T`.
 *
 * Uses the `@iarna/toml` library to parse the TOML string.
 */
@Injectable()
export class TomlParse implements Parse {
    // MARK: - Parse

    /**
     * Parses the raw TOML string into a value of type `T`.
     *
     * @param raw - The TOML string to parse.
     * @returns The parsed value.
     * @throws {@link TomlParseError} When the parse operation fails.
     */
    parse<T>(raw: string): T {
        try {
            return TOML.parse(raw) as T;
        } catch (error) {
            throw new TomlParseError();
        }
    }
}