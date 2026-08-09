// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { 
    createNodeConfiguration, 
    NODE_CONFIGURATION, 
 } from './node-configuration'

@Module({
  providers: [
    {
      provide: NODE_CONFIGURATION,
      useFactory: createNodeConfiguration,
    },
  ],
  exports: [
    NODE_CONFIGURATION
  ],
})
export class NodeConfigurationModule {}