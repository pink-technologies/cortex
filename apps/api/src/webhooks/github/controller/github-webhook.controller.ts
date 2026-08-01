// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common'
import type { RawBodyRequest } from '@nestjs/common'
import type { Request } from 'express'
import { GitHubWebhookService } from '../github-webhook.service'
import type { GitHubWebhookHandleResult } from '../models'

/**
 * Public HTTP transport for GitHub webhook deliveries.
 *
 * Exposes `POST /webhooks/github`. Requires Nest `rawBody: true` so the HMAC
 * signature can be verified against the exact bytes GitHub signed.
 */
@Controller('webhooks/github')
export class GitHubWebhookController {
  // MARK: - Constructor

  /**
   * Creates the GitHub webhook HTTP controller.
   *
   * @param gitHubWebhookService - Service that verifies and handles deliveries.
   */
  constructor(private readonly gitHubWebhookService: GitHubWebhookService) {}

  // MARK: - Instance methods

  /**
   * Accepts a GitHub webhook delivery and optionally enqueues a review job.
   *
   * @param request - Express request with {@link RawBodyRequest.rawBody}.
   * @param signatureHeader - `X-Hub-Signature-256` header value.
   * @param event - `X-GitHub-Event` header value.
   * @param deliveryId - `X-GitHub-Delivery` header value.
   * @returns Acknowledgement for GitHub (always 200 on handled deliveries).
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signatureHeader: string | undefined,
    @Headers('x-github-event') event: string | undefined,
    @Headers('x-github-delivery') deliveryId: string | undefined,
  ): Promise<GitHubWebhookHandleResult> {
    const rawBody = request.rawBody

    if (!rawBody) {
      throw new BadRequestException(
        'Raw request body is required to verify the GitHub webhook signature.',
      )
    }

    return this.gitHubWebhookService.handle({
      body: request.body,
      deliveryId,
      event,
      rawBody,
      signatureHeader,
    })
  }
}
