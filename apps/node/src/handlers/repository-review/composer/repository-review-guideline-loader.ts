// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { access, readFile, readdir, realpath } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * Maximum nested AGENTS files loaded beyond the preferred root candidates.
 */
const MAX_NESTED_AGENTS_FILES = 20

/**
 * Maximum Cursor rule files loaded from `.cursor/rules`.
 */
const MAX_CURSOR_RULE_FILES = 40

/**
 * Maximum referenced guideline files resolved from loaded instruction content.
 */
const MAX_REFERENCED_FILES = 30

/**
 * Maximum skill / reference markdown files loaded from `.agents/skills`.
 */
const MAX_AGENT_SKILL_FILES = 80

/**
 * Maximum directories visited while discovering nested instruction files.
 */
const MAX_WALKED_DIRECTORIES = 2_000

/**
 * Directory names skipped while discovering nested instruction files.
 */
const IGNORED_DIRECTORY_NAMES = new Set([
  '.git',
  'node_modules',
  'Pods',
  'DerivedData',
  'build',
  'dist',
  'coverage',
  '.build',
  'vendor',
])

/**
 * Root candidates checked first for repository agent guidelines.
 *
 * Preference order matches the review skill: override before default, then the
 * Cursor-local path.
 */
const ROOT_AGENTS_CANDIDATES = [
  'AGENTS.override.md',
  'AGENTS.md',
  join('.cursor', 'AGENTS.md'),
] as const

/**
 * One loaded guideline document ready for prompt injection.
 */
export interface RepositoryReviewGuidelineDocument {
  /**
   * Repository-relative path of the document.
   */
  readonly path: string

  /**
   * Trimmed file contents.
   */
  readonly contents: string
}

/**
 * Host-loaded project guidance for a repository review run.
 */
export interface RepositoryReviewGuidelines {
  /**
   * AGENTS / AGENTS.override documents (root + nested).
   */
  readonly agentsDocuments: readonly RepositoryReviewGuidelineDocument[]

  /**
   * Skill and reference markdown under `.agents/skills`.
   */
  readonly agentSkillDocuments: readonly RepositoryReviewGuidelineDocument[]

  /**
   * Files under `.cursor/rules`.
   */
  readonly cursorRuleDocuments: readonly RepositoryReviewGuidelineDocument[]

  /**
   * Additional files referenced by loaded instruction content.
   */
  readonly referencedDocuments: readonly RepositoryReviewGuidelineDocument[]
}

/**
 * Loads repository review guidelines from a prepared workspace.
 *
 * Discovers root and nested `AGENTS*` files, `.cursor/rules` documents, and
 * relative markdown / rule paths referenced by those files.
 *
 * @param workspacePath - Absolute path to the prepared repository workspace.
 * @returns Loaded guideline documents (empty collections when none exist).
 */
export async function loadRepositoryReviewGuidelines(
  workspacePath: string,
): Promise<RepositoryReviewGuidelines> {
  const agentsDocuments = await loadAgentsDocuments(workspacePath)
  const agentSkillDocuments = await loadAgentSkillDocuments(workspacePath)
  const cursorRuleDocuments = await loadCursorRuleDocuments(workspacePath)
  const referencedDocuments = await loadReferencedDocuments(workspacePath, [
    ...agentsDocuments,
    ...agentSkillDocuments,
    ...cursorRuleDocuments,
  ])

  return {
    agentsDocuments,
    agentSkillDocuments,
    cursorRuleDocuments,
    referencedDocuments,
  }
}

/**
 * Formats loaded guidelines for inclusion in the review engine prompt.
 *
 * @param guidelines - Documents discovered by {@link loadRepositoryReviewGuidelines}.
 * @returns Prompt section text, or `undefined` when nothing was loaded.
 */
export function formatRepositoryReviewGuidelines(
  guidelines: RepositoryReviewGuidelines,
): string | undefined {
  const sections: string[] = []

  appendGuidelineSection(sections, 'Repository agent guidelines', guidelines.agentsDocuments)
  appendGuidelineSection(sections, 'Repository agent skills', guidelines.agentSkillDocuments)
  appendGuidelineSection(sections, 'Cursor rules', guidelines.cursorRuleDocuments)
  appendGuidelineSection(sections, 'Referenced project guidelines', guidelines.referencedDocuments)

  if (sections.length === 0) {
    return undefined
  }

  return sections.join('\n\n')
}

async function loadAgentsDocuments(
  workspacePath: string,
): Promise<readonly RepositoryReviewGuidelineDocument[]> {
  const documents: RepositoryReviewGuidelineDocument[] = []
  const seen = new Set<string>()

  for (const relativePath of ROOT_AGENTS_CANDIDATES) {
    const document = await readGuidelineDocument(workspacePath, relativePath)

    if (document && !seen.has(document.path)) {
      seen.add(document.path)
      documents.push(document)
    }
  }

  const nestedPaths = await listFiles(workspacePath, (_relativePath, name) => {
    return name === 'AGENTS.md' || name === 'AGENTS.override.md'
  })

  for (const relativePath of nestedPaths) {
    if (seen.has(relativePath) || documents.length >= ROOT_AGENTS_CANDIDATES.length + MAX_NESTED_AGENTS_FILES) {
      continue
    }

    const document = await readGuidelineDocument(workspacePath, relativePath)

    if (document) {
      seen.add(document.path)
      documents.push(document)
    }
  }

  return documents
}

async function loadAgentSkillDocuments(
  workspacePath: string,
): Promise<readonly RepositoryReviewGuidelineDocument[]> {
  const skillsRoot = join(workspacePath, '.agents', 'skills')

  try {
    await access(skillsRoot)
  } catch {
    return []
  }

  const relativePaths = await listFiles(skillsRoot, (_relativePath, name) => {
    return name.endsWith('.md') || name.endsWith('.mdc')
  })

  const documents: RepositoryReviewGuidelineDocument[] = []

  for (const nestedRelative of relativePaths.slice(0, MAX_AGENT_SKILL_FILES)) {
    const repositoryRelative = join('.agents', 'skills', nestedRelative)
    const document = await readGuidelineDocument(workspacePath, repositoryRelative)

    if (document) {
      documents.push(document)
    }
  }

  return documents
}

async function loadCursorRuleDocuments(
  workspacePath: string,
): Promise<readonly RepositoryReviewGuidelineDocument[]> {
  const rulesRoot = join(workspacePath, '.cursor', 'rules')

  try {
    await access(rulesRoot)
  } catch {
    return []
  }

  const relativePaths = await listFiles(rulesRoot, (_relativePath, name) => {
    return name.endsWith('.md') || name.endsWith('.mdc')
  })

  const documents: RepositoryReviewGuidelineDocument[] = []

  for (const nestedRelative of relativePaths.slice(0, MAX_CURSOR_RULE_FILES)) {
    const repositoryRelative = join('.cursor', 'rules', nestedRelative)
    const document = await readGuidelineDocument(workspacePath, repositoryRelative)

    if (document) {
      documents.push(document)
    }
  }

  return documents
}

async function loadReferencedDocuments(
  workspacePath: string,
  sources: readonly RepositoryReviewGuidelineDocument[],
): Promise<readonly RepositoryReviewGuidelineDocument[]> {
  const candidates = new Set<string>()

  for (const source of sources) {
    for (const reference of extractReferencedPaths(source.contents)) {
      const resolved = normalizeRepositoryRelativePath(join(dirname(source.path), reference))

      if (resolved && isGuidelinePath(resolved)) {
        candidates.add(resolved)
      }
    }
  }

  const loadedPaths = new Set(sources.map((document) => document.path))
  const documents: RepositoryReviewGuidelineDocument[] = []

  for (const relativePath of [...candidates].slice(0, MAX_REFERENCED_FILES)) {
    if (loadedPaths.has(relativePath)) {
      continue
    }

    const document = await readGuidelineDocument(workspacePath, relativePath)

    if (document) {
      loadedPaths.add(document.path)
      documents.push(document)
    }
  }

  return documents
}

function extractReferencedPaths(contents: string): readonly string[] {
  const references: string[] = []
  const markdownLinkPattern = /\[[^\]]*]\(([^)]+)\)/g
  const barePathPattern = /(?:^|\s)((?:\.\/|[\w.-]+\/)+[\w.-]+\.(?:md|mdc))\b/g

  for (const match of contents.matchAll(markdownLinkPattern)) {
    const target = match[1]?.trim()

    if (target && !target.includes('://') && !target.startsWith('#')) {
      references.push(target.split(/\s+/)[0] ?? target)
    }
  }

  for (const match of contents.matchAll(barePathPattern)) {
    const target = match[1]?.trim()

    if (target) {
      references.push(target)
    }
  }

  return references
}

function isGuidelinePath(relativePath: string): boolean {
  return relativePath.endsWith('.md') || relativePath.endsWith('.mdc')
}

function normalizeRepositoryRelativePath(value: string): string | undefined {
  const normalized = value.replace(/\\/g, '/').replace(/^\.\//, '')

  if (
    normalized.length === 0 ||
    normalized.startsWith('/') ||
    normalized.includes('://') ||
    normalized.split('/').includes('..')
  ) {
    return undefined
  }

  return normalized
}

async function readGuidelineDocument(
  workspacePath: string,
  relativePath: string,
): Promise<RepositoryReviewGuidelineDocument | undefined> {
  const absolutePath = join(workspacePath, relativePath)

  try {
    await access(absolutePath)
    const contents = (await readFile(absolutePath, 'utf8')).trim()

    if (contents.length === 0) {
      return undefined
    }

    return {
      contents,
      path: relativePath.replace(/\\/g, '/'),
    }
  } catch {
    return undefined
  }
}

async function listFiles(
  rootPath: string,
  predicate: (relativePath: string, name: string) => boolean,
): Promise<string[]> {
  const results: string[] = []
  const visitedDirectories = new Set<string>()
  let walkedDirectories = 0

  async function walk(currentPath: string, relativeDirectory: string): Promise<void> {
    if (walkedDirectories >= MAX_WALKED_DIRECTORIES) {
      return
    }

    walkedDirectories += 1

    let canonicalPath: string

    try {
      canonicalPath = await realpath(currentPath)
    } catch {
      return
    }

    if (visitedDirectories.has(canonicalPath)) {
      return
    }

    visitedDirectories.add(canonicalPath)

    let entries

    try {
      entries = await readdir(currentPath, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const relativePath = relativeDirectory ? join(relativeDirectory, entry.name) : entry.name

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORY_NAMES.has(entry.name)) {
          continue
        }

        await walk(join(currentPath, entry.name), relativePath)
        continue
      }

      if (entry.isFile() && predicate(relativePath.replace(/\\/g, '/'), entry.name)) {
        results.push(relativePath.replace(/\\/g, '/'))
      }
    }
  }

  await walk(rootPath, '')
  results.sort((left, right) => left.localeCompare(right))
  return results
}

function appendGuidelineSection(
  sections: string[],
  title: string,
  documents: readonly RepositoryReviewGuidelineDocument[],
): void {
  if (documents.length === 0) {
    return
  }

  const body = documents
    .map((document) => `### ${document.path}\n\n${document.contents}`)
    .join('\n\n')

  sections.push(`## ${title}\n\n${body}`)
}
