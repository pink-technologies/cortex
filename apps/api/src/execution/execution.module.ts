// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { ExecutionJobService } from './jobs/execution-job.service'
import { EXECUTION_JOB_REPOSITORY, ExecutionJobRepositoryImpl } from './jobs/execution-job-repository'
import { ExecutionJobController } from './jobs/execution-job.controller'
import { NodesModule } from '@/nodes'

@Module({
  exports: [ExecutionJobService],
  controllers: [
    ExecutionJobController,
  ],
  imports: [
    NodesModule,
  ],
  providers: [
    ExecutionJobService,
    {
      provide: EXECUTION_JOB_REPOSITORY,
      useClass: ExecutionJobRepositoryImpl,
    },
  ],
})
export class ExecutionModule {}
