// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsEmail, IsDefined, Matches } from 'class-validator';

/**
 * Data Transfer Object representing the parameters required to
 * confirm a password reset operation.
 *
 * This DTO is used in the second step of the forgot-password flow,
 * where the user provides the confirmation code received via their
 * delivery channel along with a new password.
 *
 * Validation is intentionally strict to:
 * - ensure the confirmation code and account identifier are present,
 * - enforce password complexity requirements,
 * - prevent malformed input from reaching the authentication layer.
 */
export class ConfirmForgotPasswordParametersDto {
  /**
   * The confirmation code sent to the user as part of the password
   * recovery flow.
   *
   * This code is used to validate the password reset request and is
   * typically time-bound and single-use.
   */
  @IsDefined({ message: 'Confirmation code is required.' })
  confirmationCode: string;

  /**
   * The email address identifying the user account.
   *
   * This value must be a valid email format and is expected to be
   * normalized (e.g. lowercased and trimmed) before further processing.
   */
  @IsDefined({ message: 'Email address is required.' })
  @IsEmail(
    {},
    {
      message: 'Please enter a valid email address.',
    },
  )
  email: string;

  /**
   * The new plaintext password provided by the user.
   *
   * The password must satisfy the following requirements:
   * - at least 8 characters long,
   * - contains at least one uppercase letter,
   * - contains at least one lowercase letter,
   * - contains at least one numeric digit,
   * - contains at least one special character.
   */
  @IsDefined({ message: 'The password is required.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%*#+=()^?&])[A-Za-z\d$@!%*#+=()^?&]{8,}$/, {
    message:
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
  })
  newPassword: string;
}
