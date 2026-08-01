// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { ExecutionModule } from '@/execution/execution.module'
import { GitHubWebhookController } from './controller/github-webhook.controller'
import { GitHubWebhookService } from './github-webhook.service'

/**
 * GitHub webhook ingress for repository-review enqueue.
 */
@Module({
  controllers: [GitHubWebhookController],
  imports: [ExecutionModule],
  providers: [GitHubWebhookService],
})
export class GitHubWebhookModule {}
