// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { NodeConfigurationModule } from './configuration/node-configuration.module'
import { ExecutionJobClient } from './execution/jobs/execution-job-client'
import { SystemTestExecutor } from './execution/jobs/system-test.executor'
import { ExecutionNodeService } from './execution/jobs/execution-node.service'
import { NodeDescriptorProvider } from './node/node-descriptor.provider'
import { NodeIdentityStore } from './node/node-identity-store'
import { ExecutionNodeClient } from './node/execution-node.client'

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
    ExecutionNodeClient,
    ExecutionNodeService,
    NodeDescriptorProvider,
    NodeIdentityStore,
    SystemTestExecutor,
  ],
})
export class NodeModule {}