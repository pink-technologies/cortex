// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { createHash, timingSafeEqual } from 'node:crypto'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'

/**
 * Requires a shared operator bearer token on mutating workflow-run endpoints.
 *
 * Configuration (from env via {@link ConfigService}):
 * - `WORKFLOW_OPERATOR_TOKEN` — shared secret expected in the
 *   `Authorization: Bearer <token>` request header.
 *
 * The guard fails closed: requests are rejected with HTTP 503 while no token
 * is configured, and with HTTP 401 when the header is missing, malformed, or
 * does not match. Tokens are compared in constant time.
 */
@Injectable()
export class WorkflowOperatorGuard implements CanActivate {
  // MARK: - Constructor

  /**
   * Creates a workflow operator guard.
   *
   * @param configService - Nest config providing the expected operator token.
   */
  constructor(private readonly configService: ConfigService) {}

  // MARK: - CanActivate

  /**
   * Validates the request's operator bearer token.
   *
   * @param context - Nest execution context wrapping the HTTP request.
   * @returns `true` when the presented token matches the configured one.
   * @throws {ServiceUnavailableException} When no operator token is configured.
   * @throws {UnauthorizedException} When the header is missing or does not match.
   */
  canActivate(context: ExecutionContext): boolean {
    const expectedToken = this.configService.get<string>('WORKFLOW_OPERATOR_TOKEN')?.trim()

    if (!expectedToken) {
      throw new ServiceUnavailableException(
        'Workflow operator endpoints are not configured. Set WORKFLOW_OPERATOR_TOKEN.',
      )
    }

    const request = context.switchToHttp().getRequest<Request>()
    const [scheme, presentedToken] = request.headers.authorization?.split(' ') ?? []

    if (scheme !== 'Bearer' || !presentedToken || !this.tokensMatch(presentedToken, expectedToken)) {
      throw new UnauthorizedException('Invalid workflow operator token')
    }

    return true
  }

  // MARK: - Private methods

  private tokensMatch(presented: string, expected: string): boolean {
    const presentedDigest = createHash('sha256').update(presented).digest()
    const expectedDigest = createHash('sha256').update(expected).digest()

    return timingSafeEqual(presentedDigest, expectedDigest)
  }
}
