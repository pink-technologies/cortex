// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { UserStatus } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '@/gateway/users/repository/users.repository';
import { CreateUserParametersDto } from '@/gateway/users/dtos/parameters';
import { SignInResult } from './types/sign-in-result';
import { AccessTokenPayload } from './types/access-token-payload';
import { OrganizationsService } from '@/gateway/organizations/services/organizations/organizations.service';
import { Database } from '@/infraestructure/database';
import {
  Authenticatable,
  AuthToken,
  ProviderUserAlreadyExistsError,
  ProviderUserNotFoundError,
  RefreshTokenParameters,
  UsernameAndPasswordCredential,
} from '@/infraestructure/auth';

import {
  ConfirmForgotPasswordParametersDto,
  ConfirmSignUpParametersDto,
  EmailAndPasswordCredentialDto,
  ForgotPasswordParametersDto,
  RefreshTokenParametersDto,
  ResendConfirmationCodeParametersDto,
  SignupParametersDto,
} from '../dtos/parameters';

import {
  InactiveUserError,
  PendingUserConfirmationError,
  PhoneAlreadyRegisteredError,
  UnauthorizedError,
  UserAlreadyRegisteredError,
  UserNotFoundError,
} from './error/authentication-service-error';

/**
 * Application service responsible for coordinating authentication operations.
 *
 * This service acts as an orchestration layer between transport-level input
 * (DTOs) and the domain-level authentication contract ({@link Authenticatable}).
 *
 * Responsibilities:
 * - adapt incoming credential DTOs into domain credential objects,
 * - delegate authentication behavior to the injected {@link Authenticatable},
 * - avoid embedding provider-specific or infrastructure logic.
 *
 * This service must remain thin and free of business rules to ensure that
 * authentication behavior can evolve independently of the application layer.
 */
@Injectable()
export class AuthenticationService {
  // MARK: - Constructor

  /**
   * Creates a new {@link AuthenticationService}.
   *
   * @param authenticatable - A provider-agnostic authentication client responsible
   * for executing authentication operations (sign-in, sign-up, token refresh,
   * password recovery). The concrete implementation is injected at runtime to
   * preserve inversion of control and decouple the service from provider details.
   *
   * @param userRepository - The repository for user data access operations.
   * This dependency is injected to abstract Prisma ORM details away from the service
   * and enable testability through mocking or alternative persistence implementations.
   * @param database - Used to run multi-step persistence (e.g. confirm sign-up) atomically.
   * @param organizationsService - The service for organization data access operations.
   */
  constructor(
    private readonly authenticatable: Authenticatable,
    private readonly database: Database,
    private readonly userRepository: UserRepository,
    private readonly organizationsService: OrganizationsService,
  ) {}

  // MARK: - Instance methods

  /**
   * Confirms a password reset using a confirmation code.
   *
   * This method completes the password recovery flow by validating the
   * confirmation code and setting the new password for the account.
   *
   * This operation assumes that all input values have been validated and
   * normalized at the API boundary (e.g. lowercased and trimmed email).
   *
   * @param parameters - The parameters required to confirm the new password.
   *
   * @throws An error when the confirmation fails due to an invalid
   * code, expired code, invalid password, or an underlying provider failure.
   */
  async confirmForgotPassword(
    parameters: ConfirmForgotPasswordParametersDto,
  ): Promise<void> {
    return await this.authenticatable.confirmForgotPassword({
      username: parameters.email,
      newPassword: parameters.newPassword,
      confirmationCode: parameters.confirmationCode,
    });
  }

  /**
   * Confirms a newly created account using a confirmation code.
   *
   * completes the account verification process.
   * This method validates the confirmation code issued during sign-up and
   *
   * This operation assumes that all input values have been validated and
   * normalized at the API boundary (e.g. lowercased and trimmed email).
   *
   * @param parameters - The parameters required to confirm sign-up.
   *
   * @throws An error when confirmation fails due to an invalid
   * or expired code, an invalid request state, or an underlying provider failure.
   */
  async confirmSignUp(parameters: ConfirmSignUpParametersDto): Promise<void> {
    const user = await this.userRepository.findByEmail(parameters.email);

    if (!user) throw new UserNotFoundError();

    await this.authenticatable.confirmSignUp({
      username: parameters.email,
      confirmationCode: parameters.confirmationCode,
    });

    await this.database.withTransaction(async (transaction) => {
      await this.userRepository.updateStatus(user.id, UserStatus.ACTIVE, transaction);

      await this.organizationsService.create(
        { name: user.firstName, ownerId: user.id },
        transaction,
      );
    });
  }

  /**
   * Decodes a JWT token into a normalized access token payload.
   *
   * This method delegates decoding to the authentication provider and
   * maps the normalized payload into the application contract.
   *
   * @param accessToken - The JWT token to decode (access or ID token).
   * @returns A simplified payload containing expiration and username (email).
   */
  async decode(accessToken: string): Promise<AccessTokenPayload> {
    const payload = await this.authenticatable.decode(accessToken);

    return {
      expiresIn: new Date(payload.exp).toISOString(),
      username: payload.email,
    };
  }

  /**
   * Initiates the password recovery flow for a user account.
   *
   * This method triggers the delivery of a password recovery confirmation code
   * to the configured delivery channel (e.g. email or SMS), without revealing
   * whether the account exists.
   *
   * This operation assumes that the email has been validated and normalized
   * at the API boundary.
   *
   * @param parameters - The parameters required to initiate password recovery.
   *
   * @throws An error when the operation fails due to provider
   * errors or invalid request state.
   */
  async forgotPassword(parameters: ForgotPasswordParametersDto): Promise<void> {
    const user = await this.userRepository.findByEmail(parameters.email);
    if (!user) throw new UnauthorizedError();

    return await this.authenticatable.forgotPassword(parameters.email);
  }

  /**
   * Resends an account confirmation code.
   *
   * This method delegates the resend operation to the underlying
   * authentication provider and maps any provider-specific errors
   * into application-level authentication errors.
   *
   * Security considerations:
   * - This operation must not reveal whether the account exists.
   * - A successful execution does not guarantee that a code was sent.
   * - Errors are intentionally mapped to generic authentication failures
   *   to prevent account enumeration.
   *
   * This operation assumes that all input values have already been
   * validated and normalized at the API boundary.
   *
   * @param parameters - The parameters required to resend the
   * confirmation code.
   *
   * @throws An error when the resend operation fails due
   * to provider errors, rate limiting, or invalid request state.
   */
  async resendConfirmationCode(
    parameters: ResendConfirmationCodeParametersDto,
  ): Promise<void> {
    const user = await this.userRepository.findByEmail(parameters.email);
    if (!user) throw new UnauthorizedError();

    return await this.authenticatable.resendConfirmationCode(parameters.email);
  }

  /**
   * Refreshes authentication tokens using a previously issued refresh token.
   *
   * This method decodes the ID token to resolve the provider username,
   * validates that the user exists and is in an active state, then
   * delegates the refresh operation to the authentication provider.
   *
   * @param parameters - The parameters required to refresh the auth session.
   * @returns A new authentication token bundle.
   *
   * @throws UnauthorizedError when the user does not exist.
   * @throws InactiveUserError when the user is inactive.
   * @throws PendingUserConfirmationError when the user is not yet confirmed.
   * @throws An error when the provider rejects the refresh token.
   */
  async refreshToken(
    parameters: RefreshTokenParametersDto,
  ): Promise<AuthToken> {
    const payload = await this.authenticatable.decode(parameters.idToken);
    const email = payload.email.trim().toLowerCase();

    const user = await this.userRepository.findByEmail(email);

    if (!user) throw new UnauthorizedError();

    if (user.status === UserStatus.INACTIVE) throw new InactiveUserError();

    if (user.status === UserStatus.PENDING_CONFIRMATION)
      throw new PendingUserConfirmationError();

    const refreshTokenParameters: RefreshTokenParameters = {
      username: payload.username,
      refreshToken: parameters.refreshToken,
    };

    return await this.authenticatable.refreshToken(refreshTokenParameters);
  }

  /**
   * Authenticates a user using email and password credentials.
   *
   * This method validates that the user exists in the application database,
   * then delegates credential verification to the authentication provider.
   *
   * On success, it returns the persisted {@link User} entity together with a
   * newly issued {@link AuthToken} bundle.
   *
   * @param credential - The validated sign-in credentials.
   * @returns The authenticated user and token bundle.
   *
   * @throws UnauthorizedException when the user does not exist in the application
   * database or credentials cannot be validated.
   * @throws An error when authentication fails due to provider errors
   * or other mapped authentication failures.
   */
  async signIn(
    credential: EmailAndPasswordCredentialDto,
  ): Promise<SignInResult> {
    const user = await this.userRepository.findByEmail(credential.email);

    if (!user) throw new UnauthorizedError();

    if (user.status === UserStatus.INACTIVE) throw new InactiveUserError();

    if (user.status === UserStatus.PENDING_CONFIRMATION)
      throw new PendingUserConfirmationError();

    const usernameAndPasswordCredential = new UsernameAndPasswordCredential(
      credential.email,
      credential.password,
    );

    const token = await this.authenticatable.signIn(
      usernameAndPasswordCredential,
    );

    return { user, token };
  }

  /**
   * Creates a new user account and initiates the authentication sign-up flow.
   *
   * This method orchestrates a two-step sign-up process:
   * 1. Creates the application-level user record.
   * 2. Registers the user with the authentication provider.
   *
   * If provider registration fails after the user record is created, the user
   * record is rolled back to maintain consistency.
   *
   * This operation assumes that all input parameters have already been validated
   * and normalized at the API boundary.
   *
   * @param parameters - The parameters required to create and register a new user.
   *
   * @throws An error when provider sign-up or database storage fails.
   */
  async signUp(parameters: SignupParametersDto): Promise<void> {
    const email = parameters.email.trim().toLowerCase();
    const phone = parameters.phone.trim();
    const [existingUser, isPhoneRegistered] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.isPhoneRegistered(phone),
    ]);

    if (existingUser) {
      if (existingUser.status === UserStatus.ACTIVE)
        throw new UserAlreadyRegisteredError();

      if (existingUser.status === UserStatus.PENDING_CONFIRMATION) {
        await this.authenticatable.resendConfirmationCode(email);
        return;
      }
    }

    if (isPhoneRegistered) throw new PhoneAlreadyRegisteredError();

    const createUserParameters: CreateUserParametersDto = {
      email,
      firstName: parameters.firstName,
      lastName: parameters.lastName,
      phone,
    };

    const user = await this.userRepository.create(createUserParameters);

    try {
      await this.authenticatable.signUp({
        username: email,
        password: parameters.password,
      });
    } catch (error) {
      await this.userRepository.deleteById(user.id);

      if (error instanceof ProviderUserAlreadyExistsError) {
        throw new UserAlreadyRegisteredError();
      }

      if (error instanceof ProviderUserNotFoundError) {
        throw new UserNotFoundError();
      }

      throw error;
    }

    await this.userRepository.updateStatus(
      user.id,
      UserStatus.PENDING_CONFIRMATION,
    );
  }
}
