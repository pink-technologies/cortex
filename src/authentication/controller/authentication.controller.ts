// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Body, Controller, HttpCode, Post, Req, UseFilters } from '@nestjs/common';
import { AuthenticationExceptionFilter } from '../filter/exception.filter';
import { AuthenticationService } from '../services/authentication.service';
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
  AuthenticationTokenResponseDto,
  SignInResponseDto,
  UserResponseDto,
} from '../dtos/responses';

/**
 * HTTP controller responsible for handling authentication-related requests.
 *
 * This controller acts as the transport-layer entry point for authentication
 * operations and delegates all business logic to the
 * {@link AuthenticationService}.
 */
@Controller('/auth')
@UseFilters(AuthenticationExceptionFilter)
export class AuthenticationController {
  // MARK: - Constructor

  /**
   * Creates a new {@link AuthenticationController}.
   *
   * @param authenticationService - Application service responsible for
   * orchestrating authentication-related operations such as sign-in,
   * sign-up, token refresh, and password recovery.
   */
  constructor(private readonly authenticationService: AuthenticationService) { }

  // MARK: - Instance methods

  /**
   * Completes the password reset process for a user account.
   *
   * This endpoint verifies the password reset confirmation code and,
   * if valid, sets the new password for the account. The confirmation
   * code is typically delivered through email or another registered
   * contact method after a password reset was requested.
   *
   * Security considerations:
   * - The response does not disclose whether the account exists.
   * - Error messages are intentionally generic to prevent account enumeration.
   * - Confirmation attempts may be rate-limited to prevent brute-force attacks.
   * - Password policies are enforced before accepting the new password.
   *
   * A successful operation returns **204 No Content** with an empty body.
   *
   * @param parameters Validated data required to complete the password reset.
   * Typically includes the account identifier (e.g., email or username),
   * the confirmation code, and the new password.
   *
   * @throws HttpException If the operation fails due to:
   * - Invalid or expired confirmation code
   * - Password policy violations
   * - Invalid request state
   * - Rate limiting or security restrictions
   * - Upstream authentication provider errors
   */
  @HttpCode(204)
  @Post('confirm-forgot-password')
  async confirmForgotPassword(
    @Body() parameters: ConfirmForgotPasswordParametersDto,
  ): Promise<void> {
    await this.authenticationService.confirmForgotPassword(parameters);
  }

  /**
   * Confirms a newly registered user account.
   *
   * This endpoint verifies the confirmation code provided by the user
   * and completes the account activation process. The code is typically
   * delivered to the user through email or another registered contact method
   * during sign-up.
   *
   * Security considerations:
   * - The response does not disclose whether the account exists.
   * - Error responses are intentionally generic to prevent account enumeration.
   * - The operation may be rate-limited to prevent brute-force attempts.
   *
   * A successful confirmation returns **204 No Content** with an empty body.
   *
   * @param parameters Validated data required to confirm the account.
   * Typically includes the account identifier (e.g., email or username)
   * and the confirmation code.
   *
   * @throws HttpException If confirmation fails due to:
   * - Invalid or expired confirmation code
   * - Invalid request state (e.g., account already confirmed)
   * - Rate limiting or security restrictions
   * - Upstream authentication provider errors
   */
  @HttpCode(204)
  @Post('confirm-sign-up')
  async confirmSignUp(
    @Body() parameters: ConfirmSignUpParametersDto,
  ): Promise<void> {
    await this.authenticationService.confirmSignUp(parameters);
  }

  /**
   * Initiates the password reset flow for an account.
   *
   * This endpoint triggers the delivery of a password reset code or
   * reset instructions to the communication channel associated with
   * the provided account identifier (for example, an email address).
   *
   * Security considerations:
   * - The response is identical whether or not the account exists.
   * - A 204 response does not guarantee that a reset message was sent.
   * - Error messages are intentionally generic to prevent user enumeration.
   * - The operation may be rate-limited to mitigate abuse.
   *
   * HTTP 204 is returned with no response body when the request is accepted.
   *
   * @param parameters Validated payload required to initiate the reset process.
   *
   * @throws HttpException If the request is rejected due to validation rules,
   * rate limiting, or upstream authentication provider failures.
   */
  @HttpCode(204)
  @Post('forgot-password')
  async forgotPassword(
    @Body() parameters: ForgotPasswordParametersDto,
  ): Promise<void> {
    await this.authenticationService.forgotPassword(parameters);
  }

  /**
   * Refreshes an authentication session using a refresh token.
   *
   * This endpoint exchanges a valid refresh token for a new access token
   * and related session metadata without requiring primary credentials.
   *
   * Security considerations:
   * - The refresh token must be treated as highly sensitive.
   * - Errors are intentionally generic to prevent token leakage.
   *
   * @param parameters - The validated parameters required to refresh
   * the authentication session.
   *
   * @returns A refreshed authentication token bundle.
   *
   * @throws HttpException when the refresh token is invalid, expired,
   * revoked, or the provider rejects the request.
   */
  @HttpCode(200)
  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Body() parameters: RefreshTokenParametersDto,
  ): Promise<AuthenticationTokenResponseDto> {
    const token = await this.authenticationService.refreshToken(parameters);

    return AuthenticationTokenResponseDto.from(token);
  }

  /**
   * Resends an account confirmation code.
   *
   * This endpoint triggers the delivery of a new confirmation code
   * associated with the provided account identifier.
   *
   * Security considerations:
   * - The response does not disclose whether the account exists.
   * - A successful response does not guarantee that a code was sent.
   * - Errors are intentionally generic to prevent account enumeration.
   *
   * This operation returns no content on success.
   *
   * @param parameters - The validated parameters required to resend
   * the confirmation code.
   *
   * @throws HttpException when the operation fails due to an invalid
   * request state, rate limiting, or an underlying authentication error.
   */
  @HttpCode(204)
  @Post('resend-confirmation-code')
  async resendConfirmationCode(
    @Body() parameters: ResendConfirmationCodeParametersDto,
  ): Promise<void> {
    await this.authenticationService.resendConfirmationCode(parameters);
  }

  /**
   * Authenticates a user using email-and-password credentials.
   *
   * This endpoint accepts user credentials, validates the request body,
   * and delegates the authentication process to the
   * {@link AuthenticationService}.
   *
   * @param credential - The email-and-password credential payload.
   * @returns A normalized authentication session bundle on success.
   */
  @HttpCode(201)
  @Post('sign-in')
  async signIn(@Body() credential: EmailAndPasswordCredentialDto): Promise<SignInResponseDto> {
    const response = await this.authenticationService.signIn(credential);

    return {
      user: UserResponseDto.from(response.user),
      token: AuthenticationTokenResponseDto.from(response.token),
    };
  }

  /**
   * Registers a new user account.
   *
   * This endpoint initiates the sign-up process by:
   * - creating the application-level user record, and
   * - registering the user with the authentication provider.
   *
   * On success, no response body is returned.
   *
   * @param parameters - The validated sign-up parameters provided in the request body.
   *
   * @returns No content (`204 No Content`) when the operation completes successfully.
   *
   * @throws HttpException when the sign-up process fails due to validation,
   * authentication, or internal errors.
   */
  @HttpCode(204)
  @Post('sign-up')
  async signUp(@Body() parameters: SignupParametersDto): Promise<void> {
    await this.authenticationService.signUp(parameters);
  }
}
