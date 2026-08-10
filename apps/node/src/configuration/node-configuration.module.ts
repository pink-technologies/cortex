// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import path from 'node:path'
import { Module } from '@nestjs/common'
import { NodeConfigurationLoader } from './loaders/node-configuration-loader'
import { NODE_CONFIGURATION } from './node-configuration'

/**
 * Provides the validated {@link NodeConfiguration} for the Node process.
 *
 * Resolves `CORTEX_CONFIG_DIR` (default `<cwd>/.cortex`), then loads TOML
 * asynchronously. Invalid configuration rejects Nest bootstrap.
 */
@Module({
  providers: [
    {
      provide: NODE_CONFIGURATION,
      useFactory: async () => {
        const rootDirectory = resolveCortexConfigDirectory()
        return new NodeConfigurationLoader().loadFromRootDirectory(rootDirectory)
      },
    },
  ],
  exports: [NODE_CONFIGURATION],
})
export class NodeConfigurationModule {}

/**
 * Resolves the Cortex Node configuration directory.
 *
 * Relative `CORTEX_CONFIG_DIR` values are resolved against
 * {@link workingDirectory}, not against an ambient process cwd that may differ
 * from the injected base.
 */
function resolveCortexConfigDirectory(
  environment: NodeJS.ProcessEnv = process.env,
  workingDirectory: string = process.cwd(),
): string {
  const configured = environment.CORTEX_CONFIG_DIR?.trim()

  if (configured) {
    return path.resolve(workingDirectory, configured)
  }

  return path.resolve(workingDirectory, '.cortex')
}
