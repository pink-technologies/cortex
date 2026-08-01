// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'path';
import { readdir, readFile } from 'fs/promises'
import { AgentDefinition } from '@/definition/models/agent-definition'
import { agentSchema } from '@/definition/schema/agent-schema'
import { DECODER, Decoder } from '@/manifest/decoder/decoder'

/**
 * Loads bundled agent definitions from the local file system.
 *
 * `AgentLoader` scans a root directory containing one subdirectory per agent.
 * Each agent subdirectory is expected to include an `agent.toml` manifest and
 * the prompt file referenced by the manifest's `prompt_file` property.
 *
 * Example directory structure:
 *
 * ```text
 * .agents/agents/
 * ├── assistant/
 * │   ├── agent.toml
 * │   └── prompt.md
 * └── financial-advisor/
 *     ├── agent.toml
 *     └── prompt.md
 * ```
 *
 * The prompt file name does not need to be `prompt.md`; it is resolved relative
 * to the agent's own directory using the manifest's `prompt_file` value.
 *
 * This class acts as an infrastructure boundary. It converts file-based agent
 * definitions into validated `Agent` domain models so the rest of the runtime
 * does not depend on TOML parsing, directory traversal, or file-system details.
 */
export class AgentDefinitionLoader {
  // MARK: - Constructor

  /**
   * Creates an agent loader using the configured manifest decoder.
   *
   * @param decoder - The decoder used to parse and validate agent manifests.
   */
  constructor(    
    private readonly decoder: Decoder,
  ) {}

  // MARK: - Instance methods

  /**
   * Loads all agent definitions found under the given root directory.
   *
   * The provided directory is treated as a container of agent directories. Files
   * directly inside this directory are ignored. Each child directory is treated
   * as one agent definition and must contain an `agent.toml` manifest file.
   *
   * For each valid agent directory, this method:
   *
   * 1. Reads the `agent.toml` manifest.
   * 2. Decodes and validates the manifest using `agentSchema`.
   * 3. Resolves the configured prompt file relative to the agent directory.
   * 4. Reads the prompt file contents.
   * 5. Creates an `Agent` domain model from the manifest and prompt.
   *
   * @param rootDirectoryPath - The path to the directory containing bundled agent directories.
   * @returns A promise that resolves to the loaded agents.
   *
   * @throws AgentLoadError If an agent directory cannot be loaded, decoded,
   * or converted into an `Agent`.
   */
  async loadAgentsFromRootDirectory(rootDirectoryPath: string): Promise<AgentDefinition[]> {
    const entries = await readdir(rootDirectoryPath, { withFileTypes: true });
    const agents: AgentDefinition[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      try {
        const agentsDirectoryPath = path.join(rootDirectoryPath, entry.name);
        const manifestPath = path.join(agentsDirectoryPath, 'agent.toml');

        const raw = await readFile(manifestPath, 'utf8');
        const schema = this.decoder.decode(raw, agentSchema.parse);

        const promptPath = path.join(agentsDirectoryPath, schema.prompt_file);
        const systemPrompt = await readFile(promptPath, 'utf8');

        const agent = AgentDefinition.from(schema, systemPrompt);

        agents.push(agent);
      } catch (error) {
        throw new Error(`Failed to load agent from directory: ${entry.name}`, {
          cause: error,
        });
      }
    }

    return agents;
  }
}
