// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { NodeConfigurationModule } from '../configuration/node-configuration.module'
import { CortexClient } from './cortex-client'
import { CortexExecutionJobResource, CortexNodeResource } from './resources'

/**
 * Nest module that exposes the Cortex control-plane HTTP client and resources.
 */
@Module({
  imports: [NodeConfigurationModule],
  providers: [CortexClient, CortexExecutionJobResource, CortexNodeResource],
  exports: [CortexClient, CortexExecutionJobResource, CortexNodeResource],
})
export class CortexModule {}
