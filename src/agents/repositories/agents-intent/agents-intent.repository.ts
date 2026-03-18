// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';
import { Database } from 'src/infraestructure/database';
import type { AgentIntent } from '@prisma/client';
import { IntentNotFoundError } from '../../service/error/agents.error';

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
   * Finds an agent intent by the intent slug (e.g. "summarize", "answer_question").
   * Returns the first AgentIntent linked to that intent; use the result's agentId for the orchestrator.
   *
   * @param slug - The slug of the intent (from {@link Intent}).
   * @returns The {@link AgentIntent} with agent relation if found, or null.
   */
  async findByIntent(slug: string): Promise<AgentIntent | null> {
    const intent = await this.database.intent.findUnique({
      where: { slug: slug.trim() },
    });

    if (!intent) throw new IntentNotFoundError();

    return this.database.agentIntent.findFirst({
      where: { intentId: intent.id },
      orderBy: { createdAt: 'asc' },
    });
  }
}
