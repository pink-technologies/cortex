// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OpenAILLM } from '@/llm/openai/openai-llm';
import { DEFAULT_LLM_MODEL_TOKEN } from '@/llm/llm';
import type { LLMModel } from '@/llm';
import type { Storage } from '@/infraestructure/storage/storage';
import { STORAGE } from '@/infraestructure/storage';
import { Agent, AgentRole } from '../agent';
import { BUNDLED_AGENTS_ROOT } from '../agents.tokens';
import { agentSchema } from '../schema/agent/agent.schema';
import { PromptDrivenAgent } from '../prompt-driven/prompt-driven-agent';
import { DECODER, type Decoder } from '@/shared/types';
import {
  AgentAlreadyRegisteredError,
  AgentFileLoadError,
  DuplicateMainAgentError,
  InvalidAgentRoleError,
  NoEntryOrchestratorAgentError,
} from './error/error';

/**
 * Loads agents from TOML files under the directory injected as {@link BUNDLED_AGENTS_ROOT}
 * (wired in `AgentsModule` from `AGENTS_BUNDLED_ROOT` in env — same pattern as `REDIS_URL` in `StorageModule`).
 */
@Injectable()
export class AgentService implements OnModuleInit {
    // MARK: - Properties
    
    private mainAgentId: string | null = null;

    // MARK: - Constructor

    /**
     * Wires persistence, TOML decoding, bundled agent root, and the LLM used when building {@link PromptDrivenAgent} instances.
     *
     * Token bindings are defined in {@link AgentsModule} (`STORAGE`, {@link DECODER}, {@link BUNDLED_AGENTS_ROOT}, `LLMModule`).
     *
     * @param llm - {@link OpenAILLMClient} from `LLMModule`; passed into each {@link PromptDrivenAgent} for {@link Agent.decide}.
     * @param bundledAgentsPath - Injected via {@link BUNDLED_AGENTS_ROOT}; absolute directory path scanned for `*.toml` agent manifests.
     * @param decoder - Injected via {@link DECODER} as {@link Decoder}; parses agent `.toml` (syntax) and optional refine step (e.g. Zod).
     * @param defaultLlmModel - Injected via {@link DEFAULT_LLM_MODEL_TOKEN}; passed into each {@link PromptDrivenAgent} as {@link AgentConfiguration.model}.
     * @param storage - Injected via {@link STORAGE}; stores and loads {@link Agent} instances by id after load.
     */
    constructor(
        private readonly llm: OpenAILLM,
        @Inject(DEFAULT_LLM_MODEL_TOKEN)
        private readonly defaultLlmModel: LLMModel,
        @Inject(BUNDLED_AGENTS_ROOT)
        private readonly bundledAgentsPath: string,
        @Inject(DECODER)
        private readonly decoder: Decoder,
        @Inject(STORAGE)
        private readonly storage: Storage,
    ) {}

    // MARK: - OnModuleInit

    /**
     * Loads the agent from the TOML file when the module boots.
     */
    async onModuleInit(): Promise<void> {
        await this.loadAndRegisterAgents();
    }

    // MARK: - Instance methods

    /**
     * Looks up a bundled agent by {@link Agent.id} after {@link load} has written it to {@link STORAGE}.
     *
     * Awaits {@link ensureLoaded} first so the registry is populated. Returns `null` when no value exists
     * for `id` (same contract as {@link Storage.read}).
     *
     * @param id - The agent id from manifest `agent.toml` (`schema.id`).
     * @returns The persisted {@link Agent}, or `null` if absent.
     */
    async find(id: string): Promise<Agent | null> {
        return this.storage.read<Agent>(id);
    }

    /**
     * Returns the bundled orchestrator agent: the one registered during {@link load} as the single
     * {@link AgentRole.Assistant} (manifest `MAIN`), tracked in-memory as {@link AgentService.mainAgentId}.
     *
     * Awaits {@link ensureLoaded} first so storage and `mainAgentId` are populated. The instance is then
     * read from {@link STORAGE} by id — callers get the same object shape as {@link find}.
     *
     * Wired for the kernel’s {@link AGENT} provider in {@link AgentsModule}.
     *
     * @returns The persisted {@link Agent} for the main orchestrator.
     * @throws {@link NoEntryOrchestratorAgentError} When no main id was recorded during load, or storage has no row for that id.
     */
    async getMainAssistant(): Promise<Agent> {
        if (!this.mainAgentId) {
            throw new NoEntryOrchestratorAgentError();
        }

        const agent = await this.storage.read<Agent>(this.mainAgentId);

        if (!agent) {
            throw new NoEntryOrchestratorAgentError();
        }

        return agent;
    }

    // MARK: - Private methods

    private async loadAndRegisterAgents(): Promise<void> {
        this.mainAgentId = null;

        const entries = await readdir(this.bundledAgentsPath, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }

            const filePath = path.join(this.bundledAgentsPath, entry.name, 'agent.toml');

            try {
                const agent = await this.loadAgentFromFile(filePath);

                if (await this.storage.read<Agent>(agent.id)) throw new AgentAlreadyRegisteredError();

                await this.storage.write(agent, agent.id);
        
                if (agent.descriptor.role === AgentRole.Assistant) {
                    if (this.mainAgentId !== null) {
                        throw new DuplicateMainAgentError();
                    }
        
                    this.mainAgentId = agent.id;
                }
            } catch {
                throw new AgentFileLoadError();
            }
        }

        if (!this.mainAgentId) {
            throw new NoEntryOrchestratorAgentError();
        }
    }

    private async loadAgentFromFile(filePath: string): Promise<Agent> {
        const rawAgents = await readFile(filePath, "utf8");
        const schema = this.decoder.decode(rawAgents, (v) => agentSchema.parse(v));
        const promptFilePath = path.join(path.dirname(filePath), schema.prompt_file);
        const systemPrompt = await readFile(promptFilePath, "utf8");
        
        return new PromptDrivenAgent({
            id: schema.id,
            model: this.defaultLlmModel,
            llm: this.llm,
            systemPrompt,
            delegateAgentIds: schema.delegates_to.filter((delegate) => delegate.length > 0),
            descriptor: {
                name: schema.name,
                role: this.schemaRoleToAgent(schema.role),
                allowedSkillIds: schema.skills.filter((skill) => skill.length > 0),
                capabilities: schema.capabilities.filter((capability) => capability.length > 0),
                description: schema.description,
            }
        });
    }

    private schemaRoleToAgent(role: string): AgentRole {
        switch (role) {
            case "MAIN":
                return AgentRole.Assistant;

            case "SPECIALIST":
                return AgentRole.Specialist;

            default:
                throw new InvalidAgentRoleError();
        }
    }
}
