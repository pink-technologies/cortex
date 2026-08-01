// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Prisma } from '@prisma/client'
import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RepositoryReviewJobKind } from '@cortex/protocol'
import { ExecutionJobService } from '@/execution/execution-job.service'
import { mapGitHubWebhookToReviewEnqueue } from './mapper'
import {
  type GitHubWebhookHandleInput,
  type GitHubWebhookHandleResult,
} from './models'
import { verifyGitHubWebhookSignature } from './signature'

/**
 * Verifies GitHub webhook authenticity and enqueues `repository.review` jobs.
 *
 * Configuration (from env via {@link ConfigService}):
 * - `GITHUB_WEBHOOK_SECRET` — shared HMAC secret
 * - `GITHUB_DEFAULT_CONNECTION_ID` — Node `CORTEX_SC_CONNECTIONS` id
 * - `GITHUB_REVIEW_INSTRUCTIONS` — optional default reviewer guidance
 */
@Injectable()
export class GitHubWebhookService {
  // MARK: - Constructor

  /**
   * Creates a GitHub webhook verification and enqueue service.
   *
   * @param configService - Nest config providing webhook secret and defaults.
   * @param executionJobService - Service used to enqueue `repository.review` jobs.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly executionJobService: ExecutionJobService,
  ) {}

  // MARK: - Instance methods

  /**
   * Handles one GitHub webhook delivery.
   *
   * @param input - Raw body, signature headers, and parsed JSON body.
   * @returns Acknowledgement describing whether a job was enqueued or ignored.
   */
  async handle(input: GitHubWebhookHandleInput): Promise<GitHubWebhookHandleResult> {
    const configuration = this.requireConfiguration()

    if (!verifyGitHubWebhookSignature(input.rawBody, input.signatureHeader, configuration.secret)) {
      throw new UnauthorizedException('Invalid GitHub webhook signature.')
    }

    const mapping = mapGitHubWebhookToReviewEnqueue(
      input.event,
      input.body,
      configuration.connectionId,
      configuration.instructions,
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
        kind: RepositoryReviewJobKind,
        payload: mapping.payload,
        payloadVersion: 1,
        policy: {},
        priority: 0,
        requirements: {
          allOf: [],
        },
        source: {
          identifier: input.deliveryId ?? mapping.triggerIdentifier,
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
    connectionId: string
    instructions?: string
    secret: string
  } {
    const secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET')?.trim()
    const connectionId = this.configService.get<string>('GITHUB_DEFAULT_CONNECTION_ID')?.trim()
    const instructions = this.configService.get<string>('GITHUB_REVIEW_INSTRUCTIONS')?.trim()

    if (!secret || !connectionId) {
      throw new ServiceUnavailableException(
        'GitHub webhook is not configured. Set GITHUB_WEBHOOK_SECRET and GITHUB_DEFAULT_CONNECTION_ID.',
      )
    }

    return {
      connectionId,
      ...(instructions ? { instructions } : {}),
      secret,
    }
  }
}

/**
 * Walks an error cause chain looking for a Prisma unique-constraint failure.
 */
function isUniqueConstraintError(error: unknown): boolean {
  let current: unknown = error

  while (current instanceof Error) {
    if (current instanceof Prisma.PrismaClientKnownRequestError && current.code === 'P2002') {
      return true
    }

    current = current.cause
  }

  return false
}
