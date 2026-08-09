// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common'
import { GitHubWebhookModule } from './github'
import { JiraWebhookModule } from './jira'

/**
 * Aggregates public webhook ingress modules.
 */
@Module({
  imports: [GitHubWebhookModule, JiraWebhookModule],
})
export class WebhooksModule {}
