// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { NodesController } from './nodes.controller'
import { NODES_REPOSITORY, NodesRepositoryImpl } from './repository/nodes.repository'
import { NodesService } from './nodes.service'

@Module({
  imports: [],
  controllers: [NodesController],
  exports: [NodesService],
  providers: [
    NodesService,
    {
      provide: NODES_REPOSITORY,
      useClass: NodesRepositoryImpl,
    }
  ],
})
export class NodesModule {}