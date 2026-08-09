// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraProjectRepoMapping } from '../../../connection'
import type { JiraIssue } from '@cortex/integrations/jira'
import type { JiraRepoResolution, ResolvedJiraRepository } from '../models'

/**
 * Parses `owner/repo`, HTTPS GitHub URLs, or `git@github.com:` SSH URLs into
 * a credential-free HTTPS clone target.
 */
export function parseGitHubRepositoryReference(
  value: string,
): { cloneUrl: string; name: string; owner: string } | undefined {
  const trimmed = value.trim()

  const slugMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/)
  if (slugMatch) {
    return toHttpsClone(slugMatch[1]!, slugMatch[2]!)
  }

  const sshMatch = trimmed.match(/^git@github\.com:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/i)
  if (sshMatch) {
    return toHttpsClone(sshMatch[1]!, sshMatch[2]!)
  }

  try {
    const url = new URL(trimmed)
    const host = url.hostname.toLowerCase()
    if (host !== 'github.com' && host !== 'www.github.com') {
      return undefined
    }

    const parts = url.pathname.replace(/\.git$/i, '').split('/').filter(Boolean)
    if (parts.length < 2) {
      return undefined
    }

    return toHttpsClone(parts[0]!, parts[1]!)
  } catch {
    return undefined
  }
}

/**
 * Resolves a single GitHub repository for a Jira issue.
 *
 * Priority: payload override → remote links → custom field → project map.
 * Project-map metadata (test commands, escalate account, SC connection, default
 * branch) is merged whenever a mapping exists for the issue's project key.
 */
export function resolveJiraRepository(input: {
  readonly customFieldId?: string
  readonly issue: JiraIssue
  readonly payloadRepository?: {
    readonly cloneUrl: string
    readonly defaultBranch: string
    readonly name: string
    readonly owner: string
  }
  readonly projectRepos: readonly JiraProjectRepoMapping[]
}): JiraRepoResolution {
  const mapping = findProjectMapping(input.projectRepos, input.issue.projectKey)

  if (input.payloadRepository) {
    return {
      kind: 'resolved',
      repository: applyProjectMapping(
        {
          cloneUrl: input.payloadRepository.cloneUrl,
          defaultBranch: input.payloadRepository.defaultBranch,
          name: input.payloadRepository.name,
          owner: input.payloadRepository.owner,
          source: 'payload',
        },
        mapping,
      ),
    }
  }

  const fromLinks = uniqueRepositories(
    input.issue.remoteLinks
      .map((link) => parseGitHubRepositoryReference(link.url))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined),
  )

  if (fromLinks.length === 1) {
    const repository = fromLinks[0]!

    return {
      kind: 'resolved',
      repository: applyProjectMapping(
        {
          ...repository,
          defaultBranch: mapping?.defaultBranch ?? 'main',
          source: 'jira_links',
        },
        mapping,
      ),
    }
  }

  if (fromLinks.length > 1) {
    return {
      kind: 'ambiguous',
      repositories: fromLinks.map((entry) => `${entry.owner}/${entry.name}`),
    }
  }

  if (input.customFieldId) {
    const text = readCustomFieldText(input.issue.customFields[input.customFieldId])
    const parsed = text ? parseGitHubRepositoryReference(text) : undefined

    if (parsed) {
      return {
        kind: 'resolved',
        repository: applyProjectMapping(
          {
            ...parsed,
            defaultBranch: mapping?.defaultBranch ?? 'main',
            source: 'custom_field',
          },
          mapping,
        ),
      }
    }
  }

  if (!mapping) {
    return { kind: 'missing' }
  }

  return {
    kind: 'resolved',
    repository: {
      cloneUrl: mapping.cloneUrl,
      defaultBranch: mapping.defaultBranch,
      escalateAccountId: mapping.escalateAccountId,
      name: mapping.name,
      owner: mapping.owner,
      projectLead: mapping.projectLead,
      source: 'project_map',
      areas: mapping.areas,
      sourceControlConnectionId: mapping.sourceControlConnectionId,
      suites: mapping.suites,
      uiTestCommand: mapping.uiTestCommand,
      unitTestCommand: mapping.unitTestCommand,
    },
  }
}

function toHttpsClone(
  owner: string,
  name: string,
): { cloneUrl: string; name: string; owner: string } {
  return {
    cloneUrl: `https://github.com/${owner}/${name}.git`,
    name,
    owner,
  }
}

function findProjectMapping(
  projectRepos: readonly JiraProjectRepoMapping[],
  projectKey: string,
): JiraProjectRepoMapping | undefined {
  return projectRepos.find((entry) => entry.projectKey.toUpperCase() === projectKey.toUpperCase())
}

/**
 * Merges allowlisted commands and escalate/SC metadata from the project map.
 *
 * Payload/link/custom-field clone identity wins; mapping supplies operational
 * defaults required for repro.
 */
function applyProjectMapping(
  repository: Pick<
    ResolvedJiraRepository,
    'cloneUrl' | 'defaultBranch' | 'name' | 'owner' | 'source'
  >,
  mapping: JiraProjectRepoMapping | undefined,
): ResolvedJiraRepository {
  return {
    cloneUrl: repository.cloneUrl,
    defaultBranch: repository.defaultBranch,
    escalateAccountId: mapping?.escalateAccountId,
    name: repository.name,
    owner: repository.owner,
    projectLead: mapping?.projectLead,
    source: repository.source,
    areas: mapping?.areas,
    sourceControlConnectionId: mapping?.sourceControlConnectionId,
    suites: mapping?.suites,
    uiTestCommand: mapping?.uiTestCommand,
    unitTestCommand: mapping?.unitTestCommand,
  }
}

function readCustomFieldText(raw: unknown): string | undefined {
  if (typeof raw === 'string') {
    return raw
  }

  if (raw && typeof raw === 'object' && 'value' in raw && typeof (raw as { value: unknown }).value === 'string') {
    return (raw as { value: string }).value
  }

  return undefined
}

function uniqueRepositories(
  repositories: readonly { cloneUrl: string; name: string; owner: string }[],
): { cloneUrl: string; name: string; owner: string }[] {
  const seen = new Map<string, { cloneUrl: string; name: string; owner: string }>()

  for (const repository of repositories) {
    const key = `${repository.owner.toLowerCase()}/${repository.name.toLowerCase()}`
    if (!seen.has(key)) {
      seen.set(key, repository)
    }
  }

  return [...seen.values()]
}
