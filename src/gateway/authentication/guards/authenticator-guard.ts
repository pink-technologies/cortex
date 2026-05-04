// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { I18nService } from '@/i18n/i18n.service';
import type { User } from '@/infraestructure/database';
import type { Request } from 'express';
import { UserRepository } from '@/gateway/users/repository/users.repository';
import { getExceptionCode } from '@/shared/utils/exception-code.util';
import {
  Authenticatable,
  type AuthTokenPayload
} from '@/infraestructure/auth';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';

/**
 * Request shape augmented with the authenticated user.
 */
type AuthenticatedRequest = Request & { user: User };

/**
 * Guard that authenticates a user using the Authorization bearer token.
 */
@Injectable()
export class AuthenticatorGuard implements CanActivate {
  // MARK: - Constructor

  /**
   * Creates a new {@link AuthenticatorGuard}.
   *
   * @param authenticatable - Service responsible for decoding auth tokens.
   * @param userRepository - Repository used to resolve the authenticated user.
   */
  constructor(
    private readonly authenticatable: Authenticatable,
    private readonly userRepository: UserRepository,
    private readonly i18n: I18nService,
  ) { }

  /**
   * Validates the Authorization header, decodes the token, and attaches
   * the authenticated user to the request.
   *
   * @param context - Execution context containing the HTTP request.
   * @returns True when authentication succeeds.
   *
   * @throws UnauthorizedException when the token is missing,
   * invalid, or the user cannot be found.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.getAuthorizationToken(request);
    const payload = await this.decodeAuthToken(token);
    const user = await this.resolveAuthenticatedUser(payload);

    request.user = user;
    return true;
  }

  // MARK: - Private methods

  private getAuthorizationToken(request: Request): string {
    const authHeader = request.headers.authorization ?? '';
    const match = authHeader.trim().match(/^Bearer\s+(.+)$/i);
    const token = match?.[1]?.trim();
    if (!token) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_MISSING',
        message: this.i18n.authentication.invalidCredentials(),
      });
    }
    return token;
  }

  private async decodeAuthToken(token: string): Promise<AuthTokenPayload> {
    try {
      return await this.authenticatable.decode(token);
    } catch (error) {
      throw new UnauthorizedException({
        code: getExceptionCode(error) ?? 'INVALID_TOKEN',
        message: this.i18n.authentication.invalidCredentials(),
      });
    }
  }

  private async resolveAuthenticatedUser(payload: AuthTokenPayload): Promise<User> {
    const user = await this.userRepository.findById(payload.username);
    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: this.i18n.authentication.invalidCredentials(),
      });
    }
    return user;
  }
}