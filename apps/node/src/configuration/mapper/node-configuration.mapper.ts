// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraConnection, JiraProjectRepoMapping, SourceControlConnection } from '../../connection'
import type { NodeAnthropicConfiguration } from '../llm/node-anthropic-configuration'
import type { NodeLLMConfiguration } from '../llm/node-llm-configuration'
import type { NodeOpenAIConfiguration } from '../llm/node-openai-configuration'
import { NodeConfigurationError } from '../error/error'
import type { NodeConfiguration } from '../node-configuration'
import type { ConnectionsFile } from '../schemas/connections-file.schema'
import type { NodeFile } from '../schemas/node-file.schema'
import type { ProjectFile } from '../schemas/project-file.schema'
import type { SecretReference } from '../schemas/secret-reference.schema'

/**
 * Maps validated TOML models into the application {@link NodeConfiguration}.
 *
 * Resolves environment secrets during mapping. Secret references never appear
 * on the returned model.
 */
export function mapNodeConfiguration(input: {
  readonly connections: ConnectionsFile
  readonly environment: NodeJS.ProcessEnv
  readonly node: NodeFile
  readonly projects: readonly ProjectFile[]
}): NodeConfiguration {
  return {
    apiBaseURL: input.node.api.baseUrl,
    jiraAutomationAssigneeAccountId: input.node.jiraAutomation?.assigneeAccountId,
    jiraConnections: mapJiraConnections(input.connections, input.environment),
    jiraProjectRepos: input.projects.map((project) => mapProjectConfiguration(project)),
    jiraRepoCustomFieldId: input.node.jiraAutomation?.repoCustomFieldId,
    llm: mapLLMConfiguration(input.node.llm, input.environment),
    nodeName: input.node.node.name,
    pollingIntervalMilliseconds: input.node.node.pollingIntervalMilliseconds,
    version: input.node.node.version,
    cursorApiKey: input.node.engines?.cursor
      ? resolveEnvironmentSecret(
          input.node.engines.cursor.apiKey,
          input.environment,
          'node/engines/cursor/apiKey',
        )
      : undefined,
    sourceControlConnections: mapSourceControlConnections(
      input.connections,
      input.environment,
    ),
  }
}

/**
 * Resolves an environment secret reference to its credential string.
 *
 * Blankness is detected with `trim()`, but the returned value is the original
 * environment string so secrets are not altered.
 *
 * @param reference - Secret reference from TOML.
 * @param environment - Environment map used for lookup.
 * @param propertyPath - Configuration path included in errors (never a secret).
 * @returns The raw environment variable value.
 * @throws {NodeConfigurationError} When the variable is missing or blank.
 */
export function resolveEnvironmentSecret(
  reference: SecretReference,
  environment: NodeJS.ProcessEnv,
  propertyPath: string,
): string {
  const value = environment[reference.name]

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new NodeConfigurationError(
      `Missing environment secret "${reference.name}" at ${propertyPath}.`,
    )
  }

  return value
}

function mapLLMConfiguration(
  configuration: NodeFile['llm'] | undefined,
  environment: NodeJS.ProcessEnv,
): NodeLLMConfiguration {
  return {
    anthropic: mapAnthropicConfiguration(configuration?.anthropic, environment),
    openAI: mapOpenAIConfiguration(configuration?.openAI, environment),
  }
}

function mapOpenAIConfiguration(
  configuration: NonNullable<NodeFile['llm']>['openAI'] | undefined,
  environment: NodeJS.ProcessEnv,
): NodeOpenAIConfiguration | undefined {
  if (!configuration) {
    return undefined
  }

  return {
    apiKey: resolveEnvironmentSecret(
      configuration.apiKey,
      environment,
      'node/llm/openAI/apiKey',
    ),
  }
}

function mapAnthropicConfiguration(
  configuration: NonNullable<NodeFile['llm']>['anthropic'] | undefined,
  environment: NodeJS.ProcessEnv,
): NodeAnthropicConfiguration | undefined {
  if (!configuration) {
    return undefined
  }

  return {
    apiKey: resolveEnvironmentSecret(
      configuration.apiKey,
      environment,
      'node/llm/anthropic/apiKey',
    ),
  }
}

function mapSourceControlConnections(
  connections: ConnectionsFile,
  environment: NodeJS.ProcessEnv,
): SourceControlConnection[] {
  return connections.sourceControlConnections.map((connection) => ({
    apiBaseUrl: connection.apiBaseUrl,
    id: connection.id,
    provider: connection.provider,
    token: resolveEnvironmentSecret(
      connection.token,
      environment,
      `connections/sourceControlConnections/${connection.id}/token`,
    ),
  }))
}

function mapJiraConnections(
  connections: ConnectionsFile,
  environment: NodeJS.ProcessEnv,
): JiraConnection[] {
  return connections.jiraConnections.map((connection) => ({
    apiToken: resolveEnvironmentSecret(
      connection.apiToken,
      environment,
      `connections/jiraConnections/${connection.id}/apiToken`,
    ),
    baseUrl: connection.baseUrl,
    email: connection.email,
    id: connection.id,
    provider: connection.provider,
  }))
}

function mapProjectConfiguration(project: ProjectFile): JiraProjectRepoMapping {
  return {
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
  }
}
