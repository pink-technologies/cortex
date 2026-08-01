// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { AgentModule } from './agent'
import { NodeConfigurationModule } from './configuration/node-configuration.module'
import { CortexModule } from './cortex'
import { ExecutionModule } from './execution/execution.module'
import { ExecutionNodeService } from './execution/execution-node.service'
import { NodeDescriptorProvider } from './node/node-descriptor.provider'
import { NodeIdentityStore } from './node/node-identity-store'

/**
 * Root application module for the Cortex Node.
 *
 * Configures the services required to connect to the Cortex API, claim
 * compatible execution jobs, execute supported job kinds, and report their
 * final state.
 */
@Module({
  imports: [AgentModule, CortexModule, ExecutionModule, NodeConfigurationModule],
  providers: [ExecutionNodeService, NodeDescriptorProvider, NodeIdentityStore],
})
export class NodeModule {}
