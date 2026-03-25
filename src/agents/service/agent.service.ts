// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readFile } from "fs/promises";
import { Inject, Injectable } from "@nestjs/common";
import { TomlParse } from "@/shared/types";
import { AgentSchema, agentSchema } from "../schema/agent/agent.schema";
import { InMemoryStorage } from "@/infraestructure/storage/interfaces/in-memory.interface";
import { AgentAlreadyRegisteredError } from "../error/error";
import { Agent, AgentRole } from "../agent";

/**
 * DI token for the process-local {@link InMemoryStorage} used by the agents module.
 *
 * This token allows decoupling the storage implementation from the feature.
 * It should be bound to a concrete implementation (e.g. InMemoryStorageService)
 * within the AgentsModule or replaced with a mock during testing.
 *
 * @example
 * providers: [
 *   {
 *     provide: AGENT_IN_MEMORY_STORAGE,
 *     useClass: InMemoryStorageService,
 *   }
 * ]
 */
export const AGENT_IN_MEMORY_STORAGE = Symbol('AGENT_IN_MEMORY_STORAGE');

/**
 * Type alias for the in-memory storage used to persist {@link Agent} instances.
 *
 * This follows the generic {@link InMemoryStorage} contract used across the system,
 * avoiding the need for a dedicated registry abstraction.
 */
export type AgentInMemoryStorage = InMemoryStorage<Agent>;

/**
 * Service responsible for loading agents from a TOML configuration file.
 *
 * This service performs the following steps:
 * 1. Reads a TOML file from disk
 * 2. Parses its contents into a JavaScript object
 * 3. Validates the structure using {@link agentSchema}
 * 4. Transforms the validated schema into a domain {@link Agent}
 * 5. Returns the agent
 *
 * This service is used to load agents from a TOML file and store them in the in-memory storage.
 */
@Injectable()
export class AgentService {

    // MARK: - Constructor

    /**
     * Creates a new instance of {@link AgentService}.
     *
     * @param agentStorage - In-memory storage used to persist agent instances
     * @param tomlParser - Service responsible for parsing TOML content into objects
     */
    constructor(
        @Inject(AGENT_IN_MEMORY_STORAGE)
        private readonly agentStorage: AgentInMemoryStorage,
        private readonly tomlParser: TomlParse,
    ) { }

    // MARK: - Instance methods

    /**
     * Loads an agent from a TOML file and stores it in the in-memory storage.
     *
     * @param path - Absolute or relative file path to the TOML definition
     *
     * @throws Will throw if:
     * - The file cannot be read
     * - The TOML content is invalid
     * - The schema validation fails
     * - An agent with the same id is already registered
     */
    async load(path: string): Promise<Agent> {
        const raw = await readFile(path, "utf8");
        const parsed = this.tomlParser.parse<unknown>(raw);
        const schema = agentSchema.parse(parsed);
        const agent = this.schemaToAgent(schema);

        if (!this.agentStorage.get(agent.id)) throw new AgentAlreadyRegisteredError();

        this.agentStorage.set(agent, agent.id);

        return agent;
    }

    // MARK: - Private methods

    private schemaToAgent(schema: AgentSchema): Agent {
        const role =
            schema.role === "main" ? AgentRole.Assistant : AgentRole.Specialist;

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
                throw new Error("Decide method not implemented.");
            }
        };
    }
}