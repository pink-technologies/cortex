// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Injection token for the Storage abstraction.
 *
 * Use this token to inject the storage implementation so consumers depend
 * on the interface rather than the concrete Redis implementation.
 */
export const STORAGE = Symbol('STORAGE');
