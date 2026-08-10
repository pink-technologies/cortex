// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { NodeConfigurationError } from '../error/node-configuration-error'
import { mapNodeConfiguration } from '../mapper/node-configuration.mapper'
import type { NodeConfiguration } from '../node-configuration'
import { validateNodeConfiguration, type LoadedProject } from '../validators/node-configuration.validator'
import { ConnectionsFileSchema } from '../schemas/connections-file.schema'
import { NodeFileSchema } from '../schemas/node-file.schema'
import { ProjectFileSchema } from '../schemas/project-file.schema'
import { TomlLoader } from './toml-loader'
import { deepFreeze } from '../utilities/deep-freeze'

const NODE_FILE_NAME = 'node.toml'
const CONNECTIONS_FILE_NAME = 'connections.toml'
const PROJECTS_DIRECTORY_NAME = 'projects'

/**
 * Loads and validates Cortex Node configuration from a `.cortex` directory.
 *
 * Converts TOML files into an immutable {@link NodeConfiguration} so the rest
 * of the Node process does not depend on filesystem or TOML parsing details.
 *
 * Expected layout:
 *
 * ```text
 * .cortex/
 * ├── node.toml
 * ├── connections.toml
 * └── projects/
 *     └── *.toml
 * ```
 */
export class NodeConfigurationLoader {
  // MARK: - Properties

  private readonly environment: NodeJS.ProcessEnv
  private readonly tomlLoader: TomlLoader

  // MARK: - Constructor

  /**
   * Creates a Node configuration loader.
   *
   * @param environment - Environment map used for secret resolution.
   * @param tomlLoader - TOML file loader used for every configuration file.
   */
  constructor(environment: NodeJS.ProcessEnv = process.env, tomlLoader: TomlLoader = new TomlLoader()) {
    this.environment = environment
    this.tomlLoader = tomlLoader
  }

  // MARK: - Instance methods

  /**
   * Loads a complete Node configuration from the given `.cortex` directory.
   *
   * @param rootDirectory - Absolute path to the `.cortex` directory.
   * @returns Validated and immutable Node configuration.
   * @throws {NodeConfigurationError} When configuration is missing or invalid.
   */
  async loadFromRootDirectory(rootDirectory: string): Promise<NodeConfiguration> {
    const node = await this.loadTomlFile(path.join(rootDirectory, NODE_FILE_NAME), NODE_FILE_NAME, NodeFileSchema)

    const connections = await this.loadTomlFile(
      path.join(rootDirectory, CONNECTIONS_FILE_NAME),
      CONNECTIONS_FILE_NAME,
      ConnectionsFileSchema,
    )

    const projects = await this.loadProjects(path.join(rootDirectory, PROJECTS_DIRECTORY_NAME))

    validateNodeConfiguration({
      connections,
      projects,
    })

    return deepFreeze(
      mapNodeConfiguration({
        connections,
        environment: this.environment,
        node,
        projects: projects.map((loaded) => loaded.project),
      }),
    )
  }

  // MARK: - Private methods

  private async loadProjects(projectsDirectory: string): Promise<readonly LoadedProject[]> {
    let entries: string[]

    try {
      entries = await readdir(projectsDirectory)
    } catch (error) {
      throw new NodeConfigurationError(
        error instanceof Error ? error.toString() : 'Failed to read projects directory.',
        { cause: error },
      )
    }

    const fileNames = entries
      .filter((fileName) => fileName.endsWith('.toml'))
      .sort((left, right) => left.localeCompare(right))

    const projects: LoadedProject[] = []

    for (const fileName of fileNames) {
      const project = await this.loadTomlFile(
        path.join(projectsDirectory, fileName),
        `${PROJECTS_DIRECTORY_NAME}/${fileName}`,
        ProjectFileSchema,
      )

      projects.push({ fileName, project })
    }

    return projects
  }

  private async loadTomlFile<T>(filePath: string, fileLabel: string, schema: z.ZodType<T>): Promise<T> {
    try {
      return await this.tomlLoader.load(filePath, schema.parse)
    } catch (error) {
      throw new NodeConfigurationError(
        error instanceof Error ? error.toString() : `Failed to load configuration file "${fileLabel}".`,
        { cause: error },
      )
    }
  }
}
