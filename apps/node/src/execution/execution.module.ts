// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { AgentModule } from '../agent'
import { NodeConfigurationModule } from '../configuration/node-configuration.module'
import { ConfigJiraConnectionStore, ConfigSourceControlConnectionStore } from '../connection'
import { CortexModule } from '../cortex'
import { AgentRuntimeExecutionEngine, CursorExecutionEngine, EXECUTION_ENGINE } from '../execution-engine'
import {
  AgentExecuteJobHandler,
  JiraTriageClassifier,
  JiraTriageEscalator,
  JiraTriageJobHandler,
  RepositoryReviewJobHandler,
  TestRunner,
} from '../handlers'
import { GitWorkspaceManager } from '../workspace'
import { EXECUTION_JOB_HANDLERS, ExecutionJobHandler, ExecutionJobHandlerRegistry } from './handler'
import { ExecutionJobPoller } from './jobs/polling'
import { ExecutionJobProcessingResult, ExecutionJobProcessor } from './jobs/processing'

@Module({
  imports: [AgentModule, CortexModule, NodeConfigurationModule],
  exports: [ExecutionJobHandlerRegistry, ExecutionJobPoller, ExecutionJobProcessor],
  providers: [
    AgentExecuteJobHandler,
    AgentRuntimeExecutionEngine,
    ConfigJiraConnectionStore,
    ConfigSourceControlConnectionStore,
    CursorExecutionEngine,
    ExecutionJobHandlerRegistry,
    ExecutionJobPoller,
    ExecutionJobProcessor,
    GitWorkspaceManager,
    JiraTriageClassifier,
    JiraTriageEscalator,
    JiraTriageJobHandler,
    RepositoryReviewJobHandler,
    TestRunner,
    {
      provide: EXECUTION_ENGINE,
      useExisting: CursorExecutionEngine,
    },
    {
      provide: EXECUTION_JOB_HANDLERS,
      inject: [AgentExecuteJobHandler, RepositoryReviewJobHandler, JiraTriageJobHandler],
      useFactory: (
        agentExecuteJobHandler: AgentExecuteJobHandler,
        repositoryReviewJobHandler: RepositoryReviewJobHandler,
        jiraTriageJobHandler: JiraTriageJobHandler,
      ): readonly ExecutionJobHandler<ExecutionJobProcessingResult>[] => [
        agentExecuteJobHandler,
        repositoryReviewJobHandler,
        jiraTriageJobHandler,
      ],
    },
  ],
})
export class ExecutionModule {}
