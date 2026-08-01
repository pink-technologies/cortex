// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Prisma } from '@prisma/client'
import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JiraTriageJobKind } from '@cortex/protocol'
import { ExecutionJobService } from '@/execution/execution-job.service'
import { mapJiraWebhookToTriageEnqueue } from './mapper'
import {
  type JiraWebhookHandleInput,
  type JiraWebhookHandleResult,
} from './models'
import { verifyJiraWebhookSignature } from './signature'

/**
 * Verifies Jira webhook authenticity and enqueues `jira.triage` jobs.
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
   * @param executionJobService - Service used to enqueue `jira.triage` jobs.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly executionJobService: ExecutionJobService,
  ) {}

  // MARK: - Instance methods

  /**
   * Handles one Jira webhook delivery.
   *
   * @param input - Raw body, signature header, and parsed JSON body.
   * @returns Acknowledgement describing whether a job was enqueued or ignored.
   */
  async handle(input: JiraWebhookHandleInput): Promise<JiraWebhookHandleResult> {
    const configuration = this.requireConfiguration()

    if (
      !verifyJiraWebhookSignature(
        input.rawBody,
        input.signatureHeader,
        configuration.secret,
      )
    ) {
      throw new UnauthorizedException('Invalid Jira webhook signature.')
    }

    const mapping = mapJiraWebhookToTriageEnqueue(
      input.body,
      configuration.connectionId,
      configuration.automationAssigneeAccountId,
    )

    if (mapping.kind === 'ignore') {
      return {
        action: 'ignored',
        ok: true,
        reason: mapping.reason,
      }
    }

    try {
      const job = await this.executionJobService.create({
        activeKey: `jira.triage:${mapping.payload.issueKey}`,
        kind: JiraTriageJobKind,
        payload: mapping.payload,
        payloadVersion: 1,
        policy: {},
        priority: 0,
        requirements: {
          allOf: [],
        },
        source: {
          identifier: mapping.triggerIdentifier,
          type: 'webhook',
        },
        triggerIdentifier: mapping.triggerIdentifier,
      })

      return {
        action: 'enqueued',
        jobId: job.id,
        ok: true,
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          action: 'already_enqueued',
          ok: true,
          reason: mapping.triggerIdentifier,
        }
      }

      throw error
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

function isUniqueConstraintError(error: unknown): boolean {
  let current: unknown = error

  while (current instanceof Error) {
    if (
      current instanceof Prisma.PrismaClientKnownRequestError &&
      current.code === 'P2002'
    ) {
      return true
    }

    current = current.cause
  }

  return false
}
