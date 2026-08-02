// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { JiraProjectRepoMapping } from '../../../connection'
import type { JiraIssue } from '@cortex/integrations/jira'
import type { JiraRepoResolution } from '../models'

/**
 * Parses `owner/repo` or a GitHub URL into owner/name/cloneUrl.
 */
export function parseGitHubRepositoryReference(
  value: string,
): { cloneUrl: string; name: string; owner: string } | undefined {
  const trimmed = value.trim()

  const slugMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/)
  if (slugMatch) {
    const owner = slugMatch[1]!
    const name = slugMatch[2]!
    return {
      cloneUrl: `https://github.com/${owner}/${name}.git`,
      name,
      owner,
    }
  }

  try {
    const url = new URL(trimmed)
    if (!url.hostname.endsWith('github.com')) {
      return undefined
    }

    const parts = url.pathname.replace(/\.git$/, '').split('/').filter(Boolean)
    if (parts.length < 2) {
      return undefined
    }

    const owner = parts[0]!
    const name = parts[1]!
    return {
      cloneUrl: `https://github.com/${owner}/${name}.git`,
      name,
      owner,
    }
  } catch {
    return undefined
  }
}

/**
 * Resolves a single GitHub repository for a Jira issue.
 *
 * Priority: payload override → remote links → custom field → project map.
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
  if (input.payloadRepository) {
    const mapping = input.projectRepos.find(
      (entry) => entry.projectKey.toUpperCase() === input.issue.projectKey.toUpperCase(),
    )

    return {
      kind: 'resolved',
      repository: {
        cloneUrl: input.payloadRepository.cloneUrl,
        defaultBranch: input.payloadRepository.defaultBranch,
        escalateAccountId: mapping?.escalateAccountId,
        name: input.payloadRepository.name,
        owner: input.payloadRepository.owner,
        source: 'payload',
        sourceControlConnectionId: mapping?.sourceControlConnectionId,
        uiTestCommand: mapping?.uiTestCommand,
        unitTestCommand: mapping?.unitTestCommand,
      },
    }
  }

  const fromLinks = uniqueRepositories(
    input.issue.remoteLinks
      .map((link) => parseGitHubRepositoryReference(link.url))
      .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined),
  )

  if (fromLinks.length === 1) {
    const repository = fromLinks[0]!
    const mapping = input.projectRepos.find(
      (entry) => entry.projectKey.toUpperCase() === input.issue.projectKey.toUpperCase(),
    )

    return {
      kind: 'resolved',
      repository: {
        ...repository,
        defaultBranch: mapping?.defaultBranch ?? 'main',
        escalateAccountId: mapping?.escalateAccountId,
        source: 'jira_links',
        sourceControlConnectionId: mapping?.sourceControlConnectionId,
        uiTestCommand: mapping?.uiTestCommand,
        unitTestCommand: mapping?.unitTestCommand,
      },
    }
  }

  if (fromLinks.length > 1) {
    return {
      kind: 'ambiguous',
      repositories: fromLinks.map((entry) => `${entry.owner}/${entry.name}`),
    }
  }

  if (input.customFieldId) {
    const raw = input.issue.customFields[input.customFieldId]
    const text =
      typeof raw === 'string'
        ? raw
        : raw && typeof raw === 'object' && 'value' in raw && typeof (raw as { value: unknown }).value === 'string'
          ? (raw as { value: string }).value
          : undefined

    if (text) {
      const parsed = parseGitHubRepositoryReference(text)
      if (parsed) {
        const mapping = input.projectRepos.find(
          (entry) => entry.projectKey.toUpperCase() === input.issue.projectKey.toUpperCase(),
        )

        return {
          kind: 'resolved',
          repository: {
            ...parsed,
            defaultBranch: mapping?.defaultBranch ?? 'main',
            escalateAccountId: mapping?.escalateAccountId,
            source: 'custom_field',
            sourceControlConnectionId: mapping?.sourceControlConnectionId,
            uiTestCommand: mapping?.uiTestCommand,
            unitTestCommand: mapping?.unitTestCommand,
          },
        }
      }
    }
  }

  const mapping = input.projectRepos.find(
    (entry) => entry.projectKey.toUpperCase() === input.issue.projectKey.toUpperCase(),
  )

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
      source: 'project_map',
      sourceControlConnectionId: mapping.sourceControlConnectionId,
      uiTestCommand: mapping.uiTestCommand,
      unitTestCommand: mapping.unitTestCommand,
    },
  }
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
