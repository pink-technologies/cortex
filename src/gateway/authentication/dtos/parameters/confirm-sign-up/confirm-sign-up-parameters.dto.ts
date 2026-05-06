// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { i18nValidationMessage } from 'nestjs-i18n';
import { 
  IsEmail, 
  IsDefined 
} from 'class-validator';

export class ConfirmSignUpParametersDto {
  /**
   * The confirmation code sent to the user as part of the password
   * recovery flow.
   *
   * This code is used to validate the password reset request and is
   * typically time-bound and single-use.
   */
  @IsDefined({ message: i18nValidationMessage('authentication.confirmation_code_required') })
  confirmationCode: string;

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
