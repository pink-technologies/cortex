// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
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

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
