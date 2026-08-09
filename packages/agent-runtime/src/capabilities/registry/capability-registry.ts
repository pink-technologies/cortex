// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { CapabilityDefinition } from '../models/capability-definition'
import { KeyedRegistry } from '@/registry/keyed-registry'

/**
 * In-memory catalog of {@link CapabilityDefinition} records available to the
 * runtime.
 *
 * The registry tells Cortex what each capability provides. It is populated
 * during host bootstrap and consulted by scope resolution to translate an
 * agent's declared capability ids into the tool names those capabilities
 * contribute to an execution.
 */
export class CapabilityRegistry extends KeyedRegistry<CapabilityDefinition> {} 