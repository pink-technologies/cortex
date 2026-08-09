// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Global, Module } from '@nestjs/common'
import { API_CONFIGURATION, createApiConfiguration } from './api-configuration'

/**
 * Provides the validated {@link ApiConfiguration} for the API process.
 *
 * The factory parses `process.env` at Nest provider construction time. Invalid
 * configuration fails module initialization so the process can exit closed.
 */
@Global()
@Module({
  providers: [
    {
      provide: API_CONFIGURATION,
      useFactory: createApiConfiguration,
    },
  ],
  exports: [API_CONFIGURATION],
})
export class ApiConfigurationModule {}
