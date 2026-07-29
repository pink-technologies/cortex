// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from '@nestjs/common'
import { LLM_FACTORY, LLMFactory } from '@cortex/llm'
import { Agent } from '../models/agent'
import { AgentDefinition } from '../../definition/models/agent-definition'
import { LLMDecisionAgent } from '../../legacy/runtime/llm-decision-agent'

/**
 * Builds executable {@link Agent} instances from catalog {@link AgentDefinition} records.
 *
 * The factory is intentionally dumb: it does not load definitions from storage or resolve
 * the main agent. Pass a definition that was already loaded by {@link AgentDefinitionService}.
 */
@Injectable()
export class AgentFactory {
  // MARK: - Constructor

  /**
   * Creates a new {@link AgentFactory}.
   * 
   * @param llmFactory - Vendor-agnostic builder injected via {@link LLM_FACTORY}. Used in
   *   {@link create} to instantiate an {@link LLM} from {@link AgentDefinition.llm} plus
   *   run-time credentials (API key supplied by the caller or a future resolver — not stored
   *   on the definition). Registered in {@link LLMModule} and re-exported for {@link AgentsModule}.
   */
  constructor(
    @Inject(LLM_FACTORY)
    private readonly llmFactory: LLMFactory,
  ) {}

  // MARK: - Instance methods

  /**
   * Creates an {@link LLMDecisionAgent} from a catalog definition and runtime options.
   *
   * @param definition - Validated agent metadata and system prompt from the definitions layer.   
   * @returns An {@link Agent} ready for {@link Agent.decide}.
   */
  create(definition: AgentDefinition): Agent {
    const llm = this.llmFactory.create(
        definition.llm.provider,  
        {
            apiKey: 'definition.llm.apiKey', 
        }
    )

    return new LLMDecisionAgent(definition.id, definition.descriptor, llm, {
      capabilityIds: definition.descriptor.capabilities,
      model: definition.llm.model,
      systemPrompt: definition.descriptor.systemPrompt,
      delegateAgentIds: definition.descriptor.delegatesTo,
      skills: definition.descriptor.skills,
    })
  }
}
