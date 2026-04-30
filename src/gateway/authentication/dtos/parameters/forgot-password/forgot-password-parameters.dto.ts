// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { i18nValidationMessage } from 'nestjs-i18n';
import { 
  IsEmail, 
  IsDefined 
} from 'class-validator';

/**
 * Data Transfer Object representing the parameters required to
 * initiate a password recovery flow.
 *
 * This DTO defines the validation rules applied at the transport
 * boundary when a user requests a password reset.
 *
 * Its purpose is to ensure that only well-formed and complete input
 * reaches the authentication and application layers.
 */
export class ForgotPasswordParametersDto {
  /**
   * The email address identifying the user account.
   *
   * This value must be a valid email format and is expected to be
   * normalized (e.g. lowercased and trimmed) before further processing.
   */
  @IsDefined({ message: i18nValidationMessage('authentication.email_address_required') })
  @IsEmail(
    {},
    {
      message: i18nValidationMessage('authentication.email_address_invalid'),
    },
  )
  email: string;
}
