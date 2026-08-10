// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NodeConfigurationError } from '../error/node-configuration-error'
import type { NodeConfiguration } from '../node-configuration'
import type { ConnectionsFile } from '../schemas/connections-file.schema'
import type { NodeFile } from '../schemas/node-file.schema'
import type { ProjectFile } from '../schemas/project-file.schema'
import type { SecretReference } from '../schemas/secret-reference.schema'

/**
 * Validated TOML inputs required to build a runtime {@link NodeConfiguration}.
 *
 * Secrets are still environment references at this stage; mapping resolves them
 * into concrete credential strings.
 */
export interface NodeConfigurationInput {
  /**
   * Parsed `.cortex/connections.toml` contents.
   */
  readonly connections: ConnectionsFile

  /**
   * Environment map used to resolve secret references.
   */
  readonly environment: Readonly<NodeJS.ProcessEnv>

  /**
   * Parsed `.cortex/node.toml` contents.
   */
  readonly node: NodeFile

  /**
   * Parsed `.cortex/projects/*.toml` contents, in filename order.
   */
  readonly projects: readonly ProjectFile[]
}

/**
 * Maps validated TOML configuration into the immutable runtime configuration.
 *
 * Resolves environment secrets without exposing secret references to consumers.
 */
export function mapNodeConfiguration(input: NodeConfigurationInput): NodeConfiguration {
  const { connections, environment, node, projects } = input
  const cursor = node.engines?.cursor
  const anthropic = node.llm?.anthropic
  const openAI = node.llm?.openAI

  return {
    apiBaseURL: node.api.baseUrl,
    cursorApiKey: cursor ? resolveSecret(cursor.apiKey, environment) : undefined,
    jiraAutomationAssigneeAccountId: node.jiraAutomation?.assigneeAccountId,
    jiraRepoCustomFieldId: node.jiraAutomation?.repoCustomFieldId,
    nodeName: node.node.name,
    pollingIntervalMilliseconds: node.node.pollingIntervalMilliseconds,
    version: node.node.version,
    jiraConnections: connections.jiraConnections.map((connection) => ({
      apiToken: resolveSecret(connection.apiToken, environment),
      baseUrl: connection.baseUrl,
      email: connection.email,
      id: connection.id,
      provider: connection.provider,
    })),
    jiraProjectRepos: projects.map((project) => ({
      areas: project.areas,
      cloneUrl: project.repository.cloneUrl,
      defaultBranch: project.repository.defaultBranch,
      escalateAccountId: project.jira?.escalateAccountId,
      name: project.repository.name,
      owner: project.repository.owner,
      projectKey: project.projectKey,
      projectLead: project.projectLead,
      sourceControlConnectionId: project.repository.sourceControlConnectionId,
      suites: project.suites,
    })),
    llm: {
      anthropic: anthropic
        ? {
            apiKey: resolveSecret(anthropic.apiKey, environment),
          }
        : undefined,
      openAI: openAI
        ? {
            apiKey: resolveSecret(openAI.apiKey, environment),
          }
        : undefined,
    },
    sourceControlConnections: connections.sourceControlConnections.map((connection) => ({
      apiBaseUrl: connection.apiBaseUrl,
      id: connection.id,
      provider: connection.provider,
      token: resolveSecret(connection.token, environment),
    })),
  }
}

function resolveSecret(reference: SecretReference, environment: Readonly<NodeJS.ProcessEnv>): string {
  const value = environment[reference.name]

  if (!value?.trim()) {
    throw new NodeConfigurationError(`Missing environment secret "${reference.name}".`)
  }

  return value
}
