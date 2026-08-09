// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { WorkflowModule } from '@/workflow/workflow.module'
import { GitHubWebhookController } from './controller/github-webhook.controller'
import { GitHubWebhookService } from './github-webhook.service'

/**
 * GitHub webhook ingress at `POST /webhooks/github`.
 *
 * Verifies HMAC signatures and dispatches by `X-GitHub-Event` to registered
 * product handlers (for example `pull_request` → repository review).
 */
@Module({
  controllers: [GitHubWebhookController],
  imports: [WorkflowModule],
  providers: [GitHubWebhookService],
})
export class GitHubWebhookModule {}
