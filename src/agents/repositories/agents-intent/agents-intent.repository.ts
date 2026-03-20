// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Database } from 'src/infraestructure/database';
import type { AgentIntent } from '@prisma/client';

/**
 * Repository responsible for querying {@link AgentIntent} entities (mapping intent → agent).
 */
@Injectable()
export class AgentsIntentRepository {
  // MARK: - Constructor

  /**
   * Creates a new {@link AgentsIntentRepository}.
   *
   * @param database - The database client used to perform agent intent operations.
   * Injected at runtime to support inversion of control and enable testability.
   */
  constructor(private readonly database: Database) { }

  /**
   * Finds the first {@link AgentIntent} whose related intent matches the slug (trimmed),
   * oldest first. Covers lookup by intent slug in one step.
   *
   * @param slug - Intent slug (e.g. "summarize").
   * @returns The linked {@link AgentIntent} row, or null if the slug is unknown or no link exists.
   */
  async findByIntent(slug: string): Promise<AgentIntent | null> {
    return this.database.agentIntent.findFirst({
      where: { intent: { slug: slug.trim() } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
