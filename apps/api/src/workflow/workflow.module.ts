// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module, forwardRef } from '@nestjs/common'
import { ExecutionModule } from '../execution/execution.module'
import { WorkflowRunController } from './controller/workflow-run.controller'
import { WorkflowDefinitionRegistry } from './definitions/registry'
import { WorkflowOrchestrator } from './orchestrator'
import { WorkflowAdvancer, WorkflowApprovalHandler, WorkflowStarter } from './orchestrator/operations'
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
 * {@link WorkflowRunController}.
 */
@Module({
  controllers: [WorkflowRunController],
  exports: [WORKFLOW_RUN_REPOSITORY, WorkflowDefinitionRegistry, WorkflowOrchestrator],
  imports: [forwardRef(() => ExecutionModule)],
  providers: [
    WorkflowAdvancer,
    WorkflowApprovalHandler,
    WorkflowOrchestrator,
    WorkflowStarter,
    WorkflowTransitioner,
    {
      provide: WORKFLOW_RUN_REPOSITORY,
      useClass: WorkflowRunRepositoryImpl,
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
