// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { WorkflowDefinitionRegistry } from './definitions/registry'
import { WORKFLOW_RUN_REPOSITORY, WorkflowRunRepositoryImpl } from './repository'
import {
  agentExecuteFlow,
  issueImplementFlow,
  jiraTriageFlow,
  repositoryReviewFlow,
} from './definitions/flows'

/**
 * Workflow persistence and definition module.
 *
 * Exposes {@link WORKFLOW_RUN_REPOSITORY} and a {@link WorkflowDefinitionRegistry}
 * preloaded with built-in flows. Orchestration and HTTP enter in later chunks.
 */
@Module({
  exports: [WORKFLOW_RUN_REPOSITORY, WorkflowDefinitionRegistry],
  providers: [
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
