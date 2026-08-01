// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { SkillDefinition } from '../models/skill-definition'
import { SkillAlreadyRegisteredError, SkillNotFoundError } from '../error/error'

/**
 * In-memory catalog of {@link SkillDefinition} records available to the runtime.
 */
export class SkillRegistry {
  private readonly definitions = new Map<string, SkillDefinition>()

  get count(): number {
    return this.definitions.size
  }

  has(id: string): boolean {
    return this.definitions.has(id)
  }

  register(definition: SkillDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new SkillAlreadyRegisteredError(definition.id)
    }

    this.definitions.set(definition.id, definition)
  }

  resolve(id: string): SkillDefinition {
    const definition = this.definitions.get(id)

    if (!definition) {
      throw new SkillNotFoundError(id)
    }

    return definition
  }

  values(): readonly SkillDefinition[] {
    return [...this.definitions.values()]
  }
}
