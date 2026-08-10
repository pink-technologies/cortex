// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { RepositoryReviewJobKind } from '@cortex/protocol'
import type { NodeConfiguration } from '../node-configuration'

/**
 * Ensures the Node has the secrets required to process `repository.review`
 * jobs when that kind is advertised.
 *
 * Call after the handler registry is known so agent-only Nodes are not forced
 * to configure Cursor or GitHub. When {@link RepositoryReviewJobKind} is
 * present, both {@link NodeConfiguration.cursorApiKey} and at least one
 * source-control connection must be configured.
 *
 * Source-control entries are schema-limited to `provider = "github"` today, so
 * a nonempty connection list is sufficient. Reintroduce provider-specific
 * checks when another provider is allowed.
 *
 * @param configuration - Validated Node configuration.
 * @param supportedKinds - Job kinds this Node advertises.
 * @throws {Error} When review credentials are missing for an advertised kind.
 */
export function assertRepositoryReviewRuntimeReady(
  configuration: NodeConfiguration,
  supportedKinds: readonly string[],
): void {
  if (!supportedKinds.includes(RepositoryReviewJobKind)) {
    return
  }

  if (!configuration.cursorApiKey) {
    throw new Error(
      'CURSOR_API_KEY is required because this Node advertises repository.review.',
    )
  }

  if (configuration.sourceControlConnections.length === 0) {
    throw new Error(
      'connections.toml must include at least one GitHub connection because this Node advertises repository.review.',
    )
  }
}
