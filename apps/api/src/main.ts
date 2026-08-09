// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { API_CONFIGURATION, type ApiConfiguration } from './configuration'

async function bootstrap(): Promise<void> {
  // rawBody is required so GitHub webhook HMAC can be verified against the
  // exact bytes GitHub signed (parsed JSON is not byte-identical).
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  })

  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  )

  const configuration = app.get<ApiConfiguration>(API_CONFIGURATION)
  await app.listen(configuration.port)
}

void bootstrap().catch((error) => {
  const message =
    error instanceof Error ? `${error.message}${error.stack ? `\n${error.stack}` : ''}` : String(error)

  console.error(`[CortexAPI] Bootstrap failed: ${message}`)
  process.exit(1)
})
