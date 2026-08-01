// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { NestFactory } from '@nestjs/core'
import { NodeModule } from './node.module'

const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/node/.env'),
]

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath)
    break
  }
}

async function bootstrap(): Promise<void> {
  const application = await NestFactory.createApplicationContext(NodeModule)

  application.enableShutdownHooks()
}

void bootstrap()
