// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { KeyedRegistry } from '@/registry/keyed-registry'
import type { SkillDefinition } from '../models/skill-definition'

/**
 * In-memory catalog of {@link SkillDefinition} records available to the runtime.
 *
 * The registry tells Cortex what each skill provides. It is populated during
 * host bootstrap and consulted by scope resolution to translate an agent's
 * declared skill ids into the tool names those skills contribute to an
 * execution.
 */
export class SkillRegistry extends KeyedRegistry<SkillDefinition> {}