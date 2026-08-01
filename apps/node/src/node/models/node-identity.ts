// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Durable local identity for a Cortex execution node installation.
 *
 * Persisted on disk so claim requests remain stable across process restarts.
 */
export interface NodeIdentity {
  /**
   * Stable installation identifier unique to this Node data directory.
   */
  readonly installationId: string
}
