// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common';
import type { SourceType } from '../types/source-type';
import { KernelOriginNotFoundError } from '../service/error/kernel.error';
import {
    KERNEL_ORIGIN_ADAPTER,
    type KernelOriginAdapter,
} from './kernel-origin-adapter.interface';

/**
 * Resolves a {@link KernelOriginAdapter} by {@link SourceType}.
 *
 * Built at application bootstrap from all providers registered with
 * {@link KERNEL_ORIGIN_ADAPTER} (`multi: true`).
 */
@Injectable()
export class KernelOriginAdapterRegistry {
    private readonly byOrigin: Map<SourceType, KernelOriginAdapter>;

    // MARK: - Constructor

    /**
     * Creates a new {@link KernelOriginAdapterRegistry}.
     *
     * @param adapters - The adapters to register.
     * @throws BadRequestException when no adapter is registered for `origin`.
     */
    constructor(
        @Inject(KERNEL_ORIGIN_ADAPTER)
        adapters: KernelOriginAdapter[],
    ) {
        const list = Array.isArray(adapters) ? adapters : adapters ? [adapters] : [];
        this.byOrigin = new Map(list.map((adapter) => [adapter.origin, adapter]));
    }

    /**
     * @param origin - Ingress source from {@link KernelContext}.
     * @throws BadRequestException when no adapter is registered for `origin`.
     */
    get(origin: SourceType): KernelOriginAdapter {
        const adapter = this.byOrigin.get(origin);

        if (!adapter) throw new KernelOriginNotFoundError()

        return adapter;
    }
}
