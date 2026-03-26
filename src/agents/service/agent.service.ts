// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile, readdir } from "fs/promises";
import path from "path";

import { Inject, Injectable, OnModuleInit } from "@nestjs/common";

import { TomlParser } from "@/shared/types";

import { AgentSchema, agentSchema } from "../schema/agent/agent.schema";
import type { Storage } from "@/infraestructure/storage/storage";
import { STORAGE } from "@/infraestructure/storage/storage.tokens";
import { Agent, AgentRole } from "../agent";
import { AGENTS_BUNDLED_ROOT } from "../agents.tokens";

import {
    AgentAlreadyRegisteredError,
    AgentDecideMethodNotImplementedError,
    AgentFileLoadError
} from "./error/error";

/**
 * Loads agents from TOML files under the directory injected as {@link AGENTS_BUNDLED_ROOT}
 * (wired in `AgentsModule` from `AGENTS_BUNDLED_ROOT` in env — same pattern as `REDIS_URL` in `StorageModule`).
 */
@Injectable()
export class AgentService implements OnModuleInit {
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
    ) { }

    // MARK: - OnModuleInit

    /**
     * Loads the agent from the TOML file when the module boots.
     */
    async onModuleInit(): Promise<void> {
        await this.load();
    }

    // MARK: - Instance methods

    /**
     * Loads the agents from the TOML files.
     */
    async load(): Promise<void> {
        const entries = await readdir(this.agentsTomlPath, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }

            const filePath = path.join(this.agentsTomlPath, entry.name, "agent.toml");
            try {
                await this.loadAgentFromFile(filePath);
            } catch {
                throw new AgentFileLoadError();
            }
        }
    }

    // MARK: - Private methods

    private async loadAgentFromFile(filePath: string): Promise<Agent> {
        const raw = await readFile(filePath, "utf8");
        const parsed = this.tomlParser.parser<unknown>(raw);
        const dto = agentSchema.parse(parsed);
        const schema = AgentSchema.from(dto);
        const agent = this.schemaToAgent(schema);

        if (await this.storage.read<Agent>(agent.id)) throw new AgentAlreadyRegisteredError();

        await this.storage.write(agent, agent.id);

        return agent;
    }

    private schemaToAgent(agent: AgentSchema): Agent {
        const schema = agent.schema;
        const role = schema.role === "MAIN" ? AgentRole.Assistant : AgentRole.Specialist;

        return {
            id: schema.id,
            descriptor: {
                name: schema.name,
                role,
                allowedSkillIds: schema.skills,
                capabilities: schema.capabilities,
                description: schema.description,
            },
            decide: async () => {
                throw new AgentDecideMethodNotImplementedError();
            }
        };
    }
}
