// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsEmail, IsDefined } from 'class-validator';

/**
 * Data Transfer Object representing credentials supplied for
 * email-and-password based authentication.
 *
 * This DTO defines the validation rules required to accept user input
 * for a sign-in or sign-up operation that relies on an email address
 * and a plaintext password.
 *
 * Validation is intentionally strict to:
 * - ensure early rejection of malformed input,
 * - enforce minimum security requirements at the boundary,
 * - prevent invalid data from reaching the authentication layer.
 */
export class EmailAndPasswordCredentialDto {
  /**
   * The email address identifying the user account.
   *
   * This value must be a valid email format and is expected to be
   * normalized (e.g. lowercased and trimmed) by the application
   * before further processing.
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
   * The plaintext password provided by the user.
   */
  @IsDefined({ message: 'Password is required.' })
  password: string;
}
