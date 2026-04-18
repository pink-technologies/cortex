// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import * as TOML from '@iarna/toml';
import { Injectable } from '@nestjs/common';
import { DecoderError } from './error/error';

/**
 * Nest DI token for {@link Decoder}.
 *
 * Wire with `{ provide: DECODER, useClass: TomlDecoder }` (or `useValue` for mocks / alternate
 * parsers). Inject with `@Inject(DECODER) private readonly decoder: Decoder` so consumers depend
 * on the interface, not `TomlDecoder`.
 */
export const DECODER = Symbol('DECODER');

/**
 * Decodable type for the decoder.
 */
export type Decodable<T> = (value: unknown) => T;

/**
 * Decodes a TOML document string into a plain JavaScript value (objects, arrays, primitives).
 *
 * Either assert a compile-time `T` only, or pass a {@link TomlRefinement} to produce a real `T`
 * from `unknown` without this module depending on any particular schema library.
 */
export interface Decoder {
    /**
     * Decodes `raw` and asserts the result as `T` (**no runtime check**—`T` exists only for TypeScript).
     *
     * Prefer {@link Decoder.decode} with a {@link TomlRefinement} when you want a verified `T`.
     */
    decode<T>(raw: string): T;

    /**
     * Decodes `raw` to a value, then runs `refine` so `T` is produced by **your** logic (Swift-style “bring your own Decodable”).
     *
     * @typeParam T - Output type; inferred from `refine`’s return type when possible.
     * @param value - Full TOML document as UTF-8 text.
     * @param fn - Maps `unknown` → `T`; may throw (e.g. Zod `parse`, custom validation).
     */
    decode<T>(value: string, fn: Decodable<T>): T;
}

/**
 * Default {@link Decoder} for TOML, backed by `@iarna/toml`.
 *
 * Register as `{ provide: DECODER, useClass: TomlDecoder }` (see `decoder.token.ts`);
 * feature code should `@Inject(DECODER)` as {@link Decoder}, not this concrete class.
 */
@Injectable()
export class TomlDecoder implements Decoder {
    // MARK: - Decoder

    /**
     * @inheritdoc
     * @throws {@link DecoderError} when TOML syntax is invalid or the parser fails.
     */
    decode<T>(value: string, fn?: Decodable<T>): T {
        let parsed: unknown;

        try {
            parsed = TOML.parse(value);
        } catch (error) {
            throw new DecoderError(undefined, { cause: error });
        }

        return fn ? fn(parsed) : (parsed as T);
    }
}
