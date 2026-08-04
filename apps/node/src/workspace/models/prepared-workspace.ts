// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Prepared on-disk workspace for one execution.
 */
export interface PreparedWorkspace {
  /**
   * Absolute path of the temporary workspace directory.
   */
  readonly path: string

  /**
   * Merge-base SHA between {@link PrepareWorkspaceRequest.baseRef} and the
   * checked-out head when a base ref was requested and could be resolved.
   */
  readonly mergeBaseSha?: string
}
