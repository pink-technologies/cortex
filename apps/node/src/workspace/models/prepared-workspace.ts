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
}
