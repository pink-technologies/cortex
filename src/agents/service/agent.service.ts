// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile, readdir } from 'fs/promises';
import path from 'path';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { OpenAILLMClient } from '@/llm/client/openai/openai-llm.client';
import { TomlParser } from '@/shared/types';

import { AgentRoleDto, AgentSchema, agentSchema } from '../schema/agent/agent.schema';
import type { Storage } from '@/infraestructure/storage/storage';
import { STORAGE } from '@/infraestructure/storage/storage.tokens';
import { Agent, AgentContext, AgentRole } from '../agent';
import { AGENTS_BUNDLED_ROOT } from '../agents.tokens';

import {
    AgentAlreadyRegisteredError,
    AgentFileLoadError,
    DuplicateMainAgentError,
    InvalidAgentRoleError,
    NoEntryOrchestratorAgentError,
} from './error/error';
import { PromptDrivenAgent } from '../prompt-driven/prompt-driven-agent';

/**
 * Loads agents from TOML files under the directory injected as {@link AGENTS_BUNDLED_ROOT}
 * (wired in `AgentsModule` from `AGENTS_BUNDLED_ROOT` in env — same pattern as `REDIS_URL` in `StorageModule`).
 */
@Injectable()
export class AgentService implements OnModuleInit {
    // MARK: - Private properties

    private loadPromise: Promise<void> | null = null;

    private mainAgentId: string | null = null;

    // MARK: - Constructor

    /**
     * @param storage - Storage service for agents.
     * @param tomlParser - Toml parser for agents.
     * @param agentsTomlPath - Absolute path to the directory that contains the agents.
     */
    constructor(
        @Inject(STORAGE)
        private readonly storage: Storage,
        private readonly tomlParser: TomlParser,
        @Inject(AGENTS_BUNDLED_ROOT)
        private readonly agentsTomlPath: string,
        private readonly llm: OpenAILLMClient,
    ) { }

    // MARK: - OnModuleInit

    /**
     * Loads the agent from the TOML file when the module boots.
     */
    async onModuleInit(): Promise<void> {
        await this.ensureLoaded();
    }

    // MARK: - Instance methods

    /**
     * Resolves an agent previously persisted under {@link Agent.id} after bundled agents are loaded.
     */
    async getAgentById(id: string): Promise<Agent | null> {
        await this.ensureLoaded();
        return this.storage.read<Agent>(id);
    }

    /**
     * The bundled MAIN orchestrator used by the kernel ({@link AGENT} injection token).
     */
    async getEntryOrchestratorAgent(): Promise<Agent> {
        await this.ensureLoaded();

        if (!this.mainAgentId) throw new NoEntryOrchestratorAgentError();

        const agent = await this.storage.read<Agent>(this.mainAgentId);

        if (!agent) throw new NoEntryOrchestratorAgentError();

        return agent;
    }

    /**
     * Loads the agents from the TOML files.
     */
    async load(): Promise<void> {
        this.mainAgentId = null;
        const entries = await readdir(this.agentsTomlPath, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }

            const filePath = path.join(this.agentsTomlPath, entry.name, 'agent.toml');
            try {
                await this.loadAgentFromFile(filePath);
            } catch {
                throw new AgentFileLoadError();
            }
        }

        if (!this.mainAgentId) {
            throw new NoEntryOrchestratorAgentError();
        }
    }

    // MARK: - Private methods

    private ensureLoaded(): Promise<void> {
        if (!this.loadPromise) {
            this.loadPromise = this.load();
        }
        return this.loadPromise;
    }

    private async loadAgentFromFile(filePath: string): Promise<Agent> {
        const raw = await readFile(filePath, "utf8");
        const parsed = this.tomlParser.parser<unknown>(raw);
        const dto = agentSchema.parse(parsed);
        const schema = AgentSchema.from(dto);
        const agentDir = path.dirname(filePath);
        const prompt = await readFile(path.join(agentDir, dto.prompt_file), "utf8");
        const agent = this.schemaToAgent(schema, prompt);

        if (await this.storage.read<Agent>(agent.id)) throw new AgentAlreadyRegisteredError();

        await this.storage.write(agent, agent.id);

        if (dto.role === 'MAIN') {
            if (this.mainAgentId !== null) {
                throw new DuplicateMainAgentError();
            }
            this.mainAgentId = agent.id;
        }

        return agent;
    }

    private schemaToAgent(agent: AgentSchema, prompt: string): Agent {
        const schema = agent.schema;
        const role = this.schemaRoleToAgent(schema.role);
        const delegateAgentIds = schema.delegates_to.filter((delegate) => delegate.length > 0);
        const descriptor = {
            name: schema.name,
            role,
            allowedSkillIds: schema.skills.filter((skill) => skill.length > 0),
            capabilities: schema.capabilities.filter((capability) => capability.length > 0),
            description: schema.description,
        };

        const promptDriven = new PromptDrivenAgent({
            id: schema.id,
            descriptor,
            systemPrompt: prompt,
            llm: this.llm,
            delegateAgentIds,
        });

        return {
            id: schema.id,
            descriptor,
            decide: (context: AgentContext) => promptDriven.decide(context),
        };
    }

    private schemaRoleToAgent(role: AgentRoleDto): AgentRole {
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
