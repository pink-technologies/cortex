// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { config } from 'dotenv'
import { resolve } from 'node:path'

config({
  path: resolve(
    process.cwd(),
    'apps/node/.env',
  ),
})

import { NestFactory } from '@nestjs/core'
import { NodeModule } from './node.module'

async function bootstrap(): Promise<void> {
  const application =
    await NestFactory.createApplicationContext(
      NodeModule,
    )

  application.enableShutdownHooks()
}

void bootstrap()