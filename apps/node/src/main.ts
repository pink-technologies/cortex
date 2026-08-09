// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NestFactory } from '@nestjs/core'
import { loadNodeEnvFiles } from './configuration/load-node-env-files'
import { NodeModule } from './node.module'

loadNodeEnvFiles()

async function bootstrap(): Promise<void> {
  const application = await NestFactory.createApplicationContext(NodeModule)

  application.enableShutdownHooks()

  // Cursor SDK (and other async clients) can reject detached promises with
  // ConnectError/ETIMEDOUT. Handling unhandledRejection keeps the Node process
  // alive so the job poller can report failure and continue claiming work.
  process.on('unhandledRejection', (reason) => {
    const message =
      reason instanceof Error
        ? `${reason.message}${reason.stack ? `\n${reason.stack}` : ''}`
        : String(reason)

    // Nest may not have a scoped logger here; stderr is intentional.
    console.error(`[CortexNode] Unhandled promise rejection: ${message}`)
  })
}

void bootstrap()
