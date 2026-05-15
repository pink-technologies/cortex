// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@/shared/types';
import { CapabilityRegistryService } from '../service/registry/capability-registry.service';
import { capabilityContractProvider, type CapabilityDescription } from '../capability';

/**
 * Resolves live {@link CapabilityDescription}s for the ids declared
 * by an agent.
 *
 * Acts as the bridge between the agent layer (which only knows capability ids
 * from `agent.toml`) and the capability layer (which owns the contract providers).
 * The kernel uses it to populate {@link AgentContext.availableCapabilities}
 * before invoking {@link Agent.decide}, so prompt-driven agents see the live
 * contract of every capability they may use.
 *
 * Resilience policy:
 * - An **unknown** capability id propagates the underlying
 *   {@link CapabilityNotFoundError} (signals a misconfigured agent manifest).
 * - A capability whose executor does NOT implement {@link CapabilityContractProvider}
 *   is silently skipped (the LLM still sees the id under
 *   {@link AgentDescriptor.capabilities}).
 * - An exception thrown by a contract provider at runtime is logged and skipped, so a
 *   degraded backend (e.g. Cube unreachable) does not break the whole agent
 *   turn.
 */
@Injectable()
export class CapabilityContractResolver {
    // MARK: - Constructor

    /**
     * Creates a new {@link CapabilityContractResolver}.
     *
     * @param capabilityRegistryService - Registry used to look up executors by
     *   id; executors that implement {@link CapabilityContractProvider} are queried
     *   for their live contract.
     */
    constructor(
        private readonly capabilityRegistryService: CapabilityRegistryService,
    ) { }

    // MARK: - Instance methods

    /**
     * Resolves descriptions for the given capability ids.
     *
     * Calls each contract provider sequentially; failed ones are logged and omitted
     * from the result. Capability ids whose executor is not a contract provider are
     * also omitted.
     *
     * @param capabilityIds - Capability ids the calling agent is allowed to
     *   use (typically {@link AgentDescriptor.capabilities}).
     * @param context - Current execution scope, forwarded to each contract provider.
     * @returns The successful contracts, in the same order as {@link capabilityIds} but with skipped entries removed.
     */
    async resolve(capabilityIds: readonly string[], context: ExecutionContext): Promise<readonly CapabilityDescription[]> {
        const contracts: CapabilityDescription[] = [];

        for (const id of capabilityIds) {
            try {
                const contract = await this.contractProvider(id, context);

                if (contract) contracts.push(contract);
            }
            catch (error) {
                throw new Error(`Failed to get capability contract for "${id}": ${error}`);
            }
        }

        return contracts;
    }

    // MARK: - Private methods

    private async contractProvider(id: string, context: ExecutionContext): Promise<CapabilityDescription | null> {
        const executor = this.capabilityRegistryService.get(id);

        if (!capabilityContractProvider(executor)) return null;

        return executor.describe(context);
    }
}
