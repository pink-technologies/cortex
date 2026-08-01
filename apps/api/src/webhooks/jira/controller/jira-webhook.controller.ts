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
import { JiraWebhookService } from '../jira-webhook.service'
import type { JiraWebhookHandleResult } from '../models'

/**
 * Public HTTP transport for Jira webhook deliveries.
 *
 * Exposes `POST /webhooks/jira`. Requires Nest `rawBody: true` so the HMAC
 * signature can be verified against the exact bytes that were signed.
 */
@Controller('webhooks/jira')
export class JiraWebhookController {
  // MARK: - Constructor

  /**
   * Creates the Jira webhook HTTP controller.
   *
   * @param jiraWebhookService - Service that verifies and handles deliveries.
   */
  constructor(private readonly jiraWebhookService: JiraWebhookService) {}

  // MARK: - Instance methods

  /**
   * Accepts a Jira webhook delivery and optionally enqueues a triage job.
   *
   * @param request - Express request with {@link RawBodyRequest.rawBody}.
   * @param signatureHeader - `X-Hub-Signature` header value.
   * @param signatureHeader256 - `X-Hub-Signature-256` header value.
   * @returns Acknowledgement for Jira (always 200 on handled deliveries).
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-hub-signature') signatureHeader: string | undefined,
    @Headers('x-hub-signature-256') signatureHeader256: string | undefined,
  ): Promise<JiraWebhookHandleResult> {
    const rawBody = request.rawBody

    if (!rawBody) {
      throw new BadRequestException(
        'Raw request body is required to verify the Jira webhook signature.',
      )
    }

    return this.jiraWebhookService.handle({
      body: request.body,
      rawBody,
      signatureHeader: signatureHeader256 ?? signatureHeader,
    })
  }
}
