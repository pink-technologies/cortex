// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module, forwardRef } from '@nestjs/common'
import { NodesModule } from '@/nodes'
import { WorkflowModule } from '../workflow/workflow.module'
import { ExecutionJobController } from './controller/execution-job.controller'
import { EXECUTION_JOB_REPOSITORY, ExecutionJobRepositoryImpl } from './execution-job-repository'
import { ExecutionJobService } from './execution-job.service'
import { InternalExecutionJobController } from './controller/internal-execution-job.controller'

@Module({
  controllers: [ExecutionJobController, InternalExecutionJobController],
  exports: [ExecutionJobService, EXECUTION_JOB_REPOSITORY],
  imports: [NodesModule, forwardRef(() => WorkflowModule)],
  providers: [
    ExecutionJobService,
    {
      provide: EXECUTION_JOB_REPOSITORY,
      useClass: ExecutionJobRepositoryImpl,
    },
  ],
})
export class ExecutionModule {}
