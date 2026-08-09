// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { WorkflowModule } from '@/workflow/workflow.module'
import { JiraWebhookController } from './controller/jira-webhook.controller'
import { JiraWebhookService } from './jira-webhook.service'

/**
 * Jira webhook ingress for named routes (for example `jira-triage` →
 * `POST /api/webhooks/jira/jira-triage`).
 */
@Module({
  controllers: [JiraWebhookController],
  imports: [WorkflowModule],
  providers: [JiraWebhookService],
})
export class JiraWebhookModule {}
