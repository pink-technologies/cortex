// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ExecutionJobSourceType } from '@/execution/models'
import { WorkflowOrchestrator } from '@/workflow/orchestrator'
import {
  JiraWebhookDecisionKind,
  JiraWebhookHandleAction,
  type JiraWebhookHandleResult,
} from './models'
import { type JiraWebhookHandleParameters } from './parameters'
import { dispatchJiraWebhook } from './routes'
import { verifyJiraWebhookSignature } from './signature'

/**
 * Verifies Jira webhook authenticity and starts workflow runs for named routes.
 *
 * Configure Jira to POST to `/api/webhooks/jira/<routeName>` (triage:
 * `/api/webhooks/jira/jira-triage`). The unscoped `/api/webhooks/jira` path is
 * not registered.
 *
 * Configuration (from env via {@link ConfigService}):
 * - `JIRA_WEBHOOK_SECRET` — shared HMAC secret
 * - `JIRA_DEFAULT_CONNECTION_ID` — Node `CORTEX_JIRA_CONNECTIONS` id
 * - `JIRA_AUTOMATION_ASSIGNEE_ACCOUNT_ID` — optional assignee gate at ingress
 */
@Injectable()
export class JiraWebhookService {
  // MARK: - Constructor

  /**
   * Creates a Jira webhook verification and enqueue service.
   *
   * @param configService - Nest config providing webhook secret and defaults.
   * @param orchestrator - Orchestrator used to start workflow runs.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly orchestrator: WorkflowOrchestrator,
  ) {}

  // MARK: - Instance methods

  /**
   * Handles one Jira webhook delivery.
   *
   * @param parameters - Raw body, signature header, route name, and parsed JSON body.
   * @returns Acknowledgement describing whether a run was started or ignored.
   */
  async handle(parameters: JiraWebhookHandleParameters): Promise<JiraWebhookHandleResult> {
    const configuration = this.requireConfiguration()

    if (
      !verifyJiraWebhookSignature(
        parameters.rawBody,
        parameters.signatureHeader,
        configuration.secret,
      )
    ) {
      throw new UnauthorizedException('Invalid Jira webhook signature.')
    }

    const decision = dispatchJiraWebhook({
      body: parameters.body,
      connectionId: configuration.connectionId,
      routeName: parameters.routeName,
      ...(configuration.automationAssigneeAccountId
        ? { automationAssigneeAccountId: configuration.automationAssigneeAccountId }
        : {}),
    })

    if (decision.kind === JiraWebhookDecisionKind.IGNORE) {
      return {
        action: JiraWebhookHandleAction.IGNORED,
        ok: true,
        reason: decision.reason,
      }
    }

    const { created, job, run } = await this.orchestrator.start({
      activeKey: decision.activeKey,
      definitionKey: decision.definitionKey,
      input: decision.payload,
      source: {
        identifier: decision.triggerIdentifier,
        type: ExecutionJobSourceType.WEBHOOK,
      },
      triggerIdentifier: decision.triggerIdentifier,
    })

    if (!created) {
      return {
        action: JiraWebhookHandleAction.ALREADY_ENQUEUED,
        ok: true,
        reason: decision.triggerIdentifier,
      }
    }

    return {
      action: JiraWebhookHandleAction.ENQUEUED,
      jobId: job.id,
      ok: true,
      runId: run.id,
    }
  }

  // MARK: - Private methods

  private requireConfiguration(): {
    automationAssigneeAccountId?: string
    connectionId: string
    secret: string
  } {
    const secret = this.configService.get<string>('JIRA_WEBHOOK_SECRET')?.trim()
    const connectionId = this.configService
      .get<string>('JIRA_DEFAULT_CONNECTION_ID')
      ?.trim()
    const automationAssigneeAccountId = this.configService
      .get<string>('JIRA_AUTOMATION_ASSIGNEE_ACCOUNT_ID')
      ?.trim()

    if (!secret || !connectionId) {
      throw new ServiceUnavailableException(
        'Jira webhook is not configured. Set JIRA_WEBHOOK_SECRET and JIRA_DEFAULT_CONNECTION_ID.',
      )
    }

    return {
      ...(automationAssigneeAccountId ? { automationAssigneeAccountId } : {}),
      connectionId,
      secret,
    }
  }
}
