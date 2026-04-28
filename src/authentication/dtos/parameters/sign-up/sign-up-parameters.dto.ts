// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsDefined, IsEmail, IsPhoneNumber, Matches } from 'class-validator';

/**
 * Data Transfer Object representing the parameters required to
 * create a new user account.
 *
 * This DTO defines the validation rules applied at the transport
 * boundary for sign-up requests. Its purpose is to ensure that
 * only well-formed and complete data reaches the authentication
 * and application layers.
 *
 * Validation is intentionally strict to:
 * - reject malformed or incomplete requests early,
 * - enforce baseline security requirements (e.g. password strength),
 * - prevent invalid data from propagating into the system.
 */
export class SignupParametersDto {
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
   * The user's given (first) name.
   *
   * This field is required to complete the initial user profile
   * and may be stored or further processed by the application
   * after successful sign-up.
   */
  @IsDefined({ message: 'The first name is required.' })
  firstName: string;

  /**
   * The user's family (last) name.
   *
   * This field is required to complete the initial user profile
   * and may be stored or further processed by the application
   * after successful sign-up.
   */
  @IsDefined({ message: 'The last name is required.' })
  lastName: string;

  /**
   * The plaintext password provided by the user.
   *
   * The password must satisfy the following requirements:
   * - at least 8 characters long,
   * - contains at least one uppercase letter,
   * - contains at least one lowercase letter,
   * - contains at least one numeric digit,
   * - contains at least one special character.
   *
   * This value is highly sensitive and must never be logged,
   * persisted, or returned in any response.
   */
  @IsDefined({ message: 'The password is required.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%*#+=()^?&])[A-Za-z\d$@!%*#+=()^?&]{8,}$/, {
    message:
      'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
  })
  password: string;

  /**
   * The user's phone number.
   *
   * This value must be a valid phone number and is typically used
   * for account recovery, verification, or multi-factor
   * authentication flows.
   */
  @IsDefined({ message: 'The phone number is required.' })
  @IsPhoneNumber(undefined, { message: 'Please enter a valid phone number.' })
  phone: string;
}
