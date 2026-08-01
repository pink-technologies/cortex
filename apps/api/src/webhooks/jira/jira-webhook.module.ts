// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { ExecutionModule } from '@/execution/execution.module'
import { JiraWebhookController } from './controller/jira-webhook.controller'
import { JiraWebhookService } from './jira-webhook.service'

/**
 * Jira webhook ingress for jira.triage enqueue.
 */
@Module({
  controllers: [JiraWebhookController],
  imports: [ExecutionModule],
  providers: [JiraWebhookService],
})
export class JiraWebhookModule {}
