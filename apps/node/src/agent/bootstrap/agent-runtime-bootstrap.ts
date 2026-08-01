// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { JiraTriageJobKind, RepositoryReviewJobKind } from '@cortex/protocol'
import {
  AgentDefinitionLoader,
  AgentDefinitionRegistry,
  CapabilityDefinitionLoader,
  CapabilityRegistry,
  SkillDefinitionLoader,
  SkillRegistry,
  type SkillDefinition,
} from '@cortex/agent-runtime'

/**
 * Host bootstrap that loads bundled agent, capability, and skill definitions
 * into the runtime registries.
 *
 * Expected layout under the monorepo-root `.agents/` directory:
 *
 * ```text
 * .agents/
 * ├── agents/
 * ├── capabilities/
 * │   └── <capability-id>/
 * │       ├── capability.toml
 * │       └── skills/          # optional capability-local skills
 * └── skills/                  # shared skills
 * ```
 *
 * Skills are loaded from the shared skills root and from each capability
 * package skills subdirectory. Initialization is idempotent: concurrent
 * callers share a single in-flight promise.
 */
export class AgentRuntimeBootstrap {
  // MARK: - Properties

  private bootstrapPromise: Promise<void> | undefined
  private readonly agentsDirectory: string
  private readonly capabilitiesDirectory: string
  private readonly skillsDirectory: string
  private readonly agentDefinitionLoader: AgentDefinitionLoader
  private readonly agentDefinitionRegistry: AgentDefinitionRegistry
  private readonly capabilityDefinitionLoader: CapabilityDefinitionLoader
  private readonly capabilityRegistry: CapabilityRegistry
  private readonly skillDefinitionLoader: SkillDefinitionLoader
  private readonly skillRegistry: SkillRegistry

  // MARK: - Constructor

  /**
   * @param agentsDirectory - Root directory of bundled agent packages.
   * @param capabilitiesDirectory - Root directory of bundled capability packages.
   * @param skillsDirectory - Shared bundled skills root directory.
   * @param agentDefinitionLoader - Loader for agent manifests.
   * @param agentDefinitionRegistry - Registry receiving loaded agents.
   * @param capabilityDefinitionLoader - Loader for capability manifests.
   * @param capabilityRegistry - Registry receiving loaded capabilities.
   * @param skillDefinitionLoader - Loader for skill manifests.
   * @param skillRegistry - Registry receiving loaded skills.
   */
  constructor(
    agentsDirectory: string,
    capabilitiesDirectory: string,
    skillsDirectory: string,
    agentDefinitionLoader: AgentDefinitionLoader,
    agentDefinitionRegistry: AgentDefinitionRegistry,
    capabilityDefinitionLoader: CapabilityDefinitionLoader,
    capabilityRegistry: CapabilityRegistry,
    skillDefinitionLoader: SkillDefinitionLoader,
    skillRegistry: SkillRegistry,
  ) {
    this.agentsDirectory = agentsDirectory
    this.capabilitiesDirectory = capabilitiesDirectory
    this.skillsDirectory = skillsDirectory
    this.agentDefinitionLoader = agentDefinitionLoader
    this.agentDefinitionRegistry = agentDefinitionRegistry
    this.capabilityDefinitionLoader = capabilityDefinitionLoader
    this.capabilityRegistry = capabilityRegistry
    this.skillDefinitionLoader = skillDefinitionLoader
    this.skillRegistry = skillRegistry
  }

  // MARK: - Instance methods

  /**
   * Loads and registers bundled agents, capabilities, and skills once.
   *
   * Concurrent callers share the same in-flight promise.
   *
   * @returns Resolves when bootstrap completes.
   */
  initialize(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap()
    }

    return this.bootstrapPromise
  }

  // MARK: - Private methods

  private async bootstrap(): Promise<void> {
    await this.registerAgents()
    await this.registerCapabilities()
    await this.registerSkills()
    this.assertRepositoryReviewAgentPresent()
    this.assertJiraTriageAgentPresent()
  }

  private async registerAgents(): Promise<void> {
    const definitions = await this.agentDefinitionLoader.loadAgentsFromRootDirectory(
      this.agentsDirectory,
    )

    if (definitions.length === 0) {
      throw new Error(`No agent definitions were found in '${this.agentsDirectory}'.`)
    }

    const identifiers = new Set<string>()

    for (const definition of definitions) {
      if (identifiers.has(definition.id)) {
        throw new Error(`The agent identifier '${definition.id}' is declared more than once.`)
      }

      if (this.agentDefinitionRegistry.has(definition.id)) {
        throw new Error(`The agent identifier '${definition.id}' is already registered.`)
      }

      identifiers.add(definition.id)
    }

    for (const definition of definitions) {
      this.agentDefinitionRegistry.register(definition)
    }
  }

  private async registerCapabilities(): Promise<void> {
    const definitions = await this.capabilityDefinitionLoader.loadFromRootDirectory(
      this.capabilitiesDirectory,
    )

    if (definitions.length === 0) {
      throw new Error(
        `No capability definitions were found in '${this.capabilitiesDirectory}'.`,
      )
    }

    const identifiers = new Set<string>()

    for (const definition of definitions) {
      if (identifiers.has(definition.id)) {
        throw new Error(
          `The capability identifier '${definition.id}' is declared more than once.`,
        )
      }

      if (this.capabilityRegistry.has(definition.id)) {
        throw new Error(
          `The capability identifier '${definition.id}' is already registered.`,
        )
      }

      identifiers.add(definition.id)
    }

    for (const definition of definitions) {
      this.capabilityRegistry.register(definition)
    }
  }

  private async registerSkills(): Promise<void> {
    const shared = await this.skillDefinitionLoader.loadFromRootDirectory(
      this.skillsDirectory,
    )
    const capabilityLocal = await this.skillDefinitionLoader.loadFromDomainPackages(
      this.capabilitiesDirectory,
    )

    this.registerSkillDefinitions([...shared, ...capabilityLocal])
  }

  private registerSkillDefinitions(definitions: readonly SkillDefinition[]): void {
    const identifiers = new Set<string>()

    for (const definition of definitions) {
      if (identifiers.has(definition.id)) {
        throw new Error(`The skill identifier '${definition.id}' is declared more than once.`)
      }

      if (this.skillRegistry.has(definition.id)) {
        throw new Error(`The skill identifier '${definition.id}' is already registered.`)
      }

      identifiers.add(definition.id)
    }

    for (const definition of definitions) {
      this.skillRegistry.register(definition)
    }
  }

  private assertRepositoryReviewAgentPresent(): void {
    this.assertCapabilityAgentPresent(RepositoryReviewJobKind, 'coder')
  }

  private assertJiraTriageAgentPresent(): void {
    this.assertCapabilityAgentPresent(JiraTriageJobKind, 'qa')
  }

  private assertCapabilityAgentPresent(kind: string, fallbackAgentId: string): void {
    if (!this.capabilityRegistry.has(kind)) {
      return
    }

    const capability = this.capabilityRegistry.resolve(kind)
    const agentId = capability.defaultAgentId ?? fallbackAgentId

    if (!this.agentDefinitionRegistry.has(agentId)) {
      throw new Error(
        `Agent '${agentId}' is required because capability '${kind}' is registered.`,
      )
    }
  }
}
