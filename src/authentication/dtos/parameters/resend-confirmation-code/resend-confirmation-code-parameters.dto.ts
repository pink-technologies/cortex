// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsEmail, IsDefined } from 'class-validator';

/**
 * Data Transfer Object representing the parameters required to
 * resend an account confirmation code.
 */
export class ResendConfirmationCodeParametersDto {
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
}
