// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { NestFactory } from '@nestjs/core'
import { loadNodeEnvFiles } from './configuration/load-node-env-files'
import { NodeModule } from './node.module'

loadNodeEnvFiles()

async function bootstrap(): Promise<void> {
  const application = await NestFactory.createApplicationContext(NodeModule)

  application.enableShutdownHooks()

  process.on('unhandledRejection', (reason) => {
    const message =
      reason instanceof Error
        ? `${reason.message}${reason.stack ? `\n${reason.stack}` : ''}`
        : String(reason)
    
    console.error(`[CortexNode] Unhandled promise rejection: ${message}`)
  })
}

void bootstrap().catch((error) => {
  const message =
    error instanceof Error ? `${error.message}${error.stack ? `\n${error.stack}` : ''}` : String(error)

  console.error(`[CortexNode] Bootstrap failed: ${message}`)
  process.exit(1)
})
