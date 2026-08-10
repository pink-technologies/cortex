// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Lists repository-relative paths changed since the merge base (or empty).
 *
 * Uses `git diff --name-only <mergeBaseSha>...HEAD` when a merge base is known.
 * Returns an empty list when the merge base is missing or git fails — callers
 * should treat that as “no path filter” rather than inventing paths.
 *
 * @param workspacePath - Absolute path to the prepared git workspace.
 * @param mergeBaseSha - Optional merge-base SHA from workspace preparation.
 * @param signal - Optional abort signal for the git subprocess.
 */
export async function listRepositoryReviewChangedPaths(
  workspacePath: string,
  mergeBaseSha: string | undefined,
  signal?: AbortSignal,
): Promise<readonly string[]> {
  if (!mergeBaseSha || mergeBaseSha.trim().length === 0) {
    return []
  }

  signal?.throwIfAborted()

  try {
    const result = await execFileAsync(
      'git',
      ['diff', '--name-only', `${mergeBaseSha.trim()}...HEAD`],
      {
        cwd: workspacePath,
        encoding: 'utf8',
        signal,
      },
    )

    const stdout = typeof result === 'string' ? result : (result.stdout ?? '')

    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  } catch {
    return []
  }
}
