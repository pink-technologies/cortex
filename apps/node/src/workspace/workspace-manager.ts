// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { PrepareWorkspaceRequest, PreparedWorkspace } from './models'

/**
 * Prepares and cleans up temporary repository workspaces.
 *
 * Responsibilities:
 * - create a temporary directory
 * - clone the repository with credentials
 * - check out the requested revision
 * - remove the workspace when the job finishes
 */
export interface WorkspaceManager {
  /**
   * Removes a previously prepared workspace.
   *
   * @param workspace - Workspace returned by {@link prepare}.
   */
  cleanup(workspace: PreparedWorkspace): Promise<void>

  /**
   * Clones the repository and checks out the requested revision.
   *
   * @param request - Clone URL, token, revision, and cancellation signal.
   * @returns The prepared workspace.
   */
  prepare(request: PrepareWorkspaceRequest): Promise<PreparedWorkspace>
}
