// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { AgentDefinition } from '@/definition/models'
import { KeyedRegistry } from '@/registry/keyed-registry'

/**
 * In-memory catalog of {@link AgentDefinition} records available to the runtime.
 *
 * The registry is the lookup boundary between static agent configuration and
 * executable agents. Definitions are indexed by {@link AgentDefinition.id} and
 * are typically populated once at startup from
 * {@link AgentDefinitionLoader.loadAgentsFromRootDirectory} (or an equivalent
 * host bootstrap). {@link AgentRuntime.execute} resolves
 * {@link AgentRuntimeRequest.agentId} through this registry, then asks
 * {@link AgentFactory} to build a fresh executable agent for that run.
 */
export class AgentDefinitionRegistry extends KeyedRegistry<AgentDefinition> {}