// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable, Logger } from '@nestjs/common'
import { type ExecutionJob as ProtocolExecutionJob } from '@cortex/protocol'
  
  @Injectable()
  export class SystemTestExecutor {
    // MARK: - Private Properties
  
    private readonly logger =
      new Logger(SystemTestExecutor.name)
  
    // MARK: - Instance Methods
  
    async execute(
      executionJob: ProtocolExecutionJob,
    ): Promise<void> {
      this.logger.log(
        `Executing system test job ${executionJob.id}`,
      )
  
      await new Promise(resolve => {
        setTimeout(resolve, 1_000)
      })
  
      this.logger.log(
        `System test job ${executionJob.id} succeeded`,
      )
    }
  }