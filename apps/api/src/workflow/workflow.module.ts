// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module, forwardRef } from '@nestjs/common'
import { ExecutionModule } from '../execution/execution.module'
import { WORKFLOW_JOB_LIFECYCLE } from '../execution/ports'
import { WorkflowRunController } from './controller/workflow-run.controller'
import { WorkflowDefinitionRegistry } from './definitions/registry'
import { WorkflowOrchestrator } from './orchestrator'
import { WorkflowAdvancer, WorkflowApprovalHandler, WorkflowCanceller, WorkflowStarter } from './orchestrator/operations'
import { WorkflowTransitioner } from './orchestrator/transitions'
import { WORKFLOW_RUN_REPOSITORY, WorkflowRunRepositoryImpl } from './repository'
import {
  agentExecuteFlow,
  issueImplementFlow,
  jiraTriageFlow,
  repositoryReviewFlow,
} from './definitions/flows'

/**
 * Workflow persistence, definitions, orchestration, and HTTP module.
 *
 * Exposes {@link WORKFLOW_RUN_REPOSITORY}, {@link WorkflowDefinitionRegistry},
 * and {@link WorkflowOrchestrator}, plus the public workflow-run endpoints via
 * {@link WorkflowRunController}. Binds {@link WORKFLOW_JOB_LIFECYCLE} to
 * {@link WorkflowAdvancer} so execution notifies claim/complete/fail through an
 * explicit port without depending on {@link WorkflowOrchestrator}.
 */
@Module({
  controllers: [WorkflowRunController],
  exports: [
    WORKFLOW_JOB_LIFECYCLE,
    WORKFLOW_RUN_REPOSITORY,
    WorkflowDefinitionRegistry,
    WorkflowOrchestrator,
  ],
  imports: [forwardRef(() => ExecutionModule)],
  providers: [
    WorkflowAdvancer,
    WorkflowApprovalHandler,
    WorkflowCanceller,
    WorkflowOrchestrator,
    WorkflowStarter,
    WorkflowTransitioner,
    {
      provide: WORKFLOW_RUN_REPOSITORY,
      useClass: WorkflowRunRepositoryImpl,
    },
    {
      provide: WORKFLOW_JOB_LIFECYCLE,
      useExisting: WorkflowAdvancer,
    },
    {
      provide: WorkflowDefinitionRegistry,
      useFactory: (): WorkflowDefinitionRegistry => {
        const registry = new WorkflowDefinitionRegistry()
        registry.register(agentExecuteFlow)
        registry.register(issueImplementFlow)
        registry.register(jiraTriageFlow)
        registry.register(repositoryReviewFlow)
        return registry
      },
    },
  ],
})
export class WorkflowModule {}
