// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { NodeConfigurationModule } from './configuration/node-configuration.module'
import { ExecutionJobClient } from './execution/execution-job-client'
import { SystemTestExecutor } from './execution/system-test.executor'
import { ExecutionNodeService } from './execution-node.service'

/**
 * Root application module for the Cortex Node.
 *
 * Configures the services required to connect to the Cortex API, claim
 * compatible execution jobs, execute supported job kinds, and report their
 * final state.
 */
@Module({
  imports: [
    NodeConfigurationModule,
  ],
  providers: [
    ExecutionJobClient,
    ExecutionNodeService,
    SystemTestExecutor,
  ],
})
export class NodeModule {}