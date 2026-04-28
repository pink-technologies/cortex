// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Authenticatable } from '@/infraestructure/auth';
import type { User } from '@/infraestructure/database';
import type { Request } from 'express';
import { UserRepository } from '@/users/repository/users.repository';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
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
    const authHeader = request.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      throw new UnauthorizedException('Authorization token is required.');
    }

    const payload = await this.authenticatable.decode(token);
    const user = await this.userRepository.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    request.user = user;
    return true;
  }
}
