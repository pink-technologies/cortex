// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { i18nValidationMessage } from 'nestjs-i18n';
import {
  IsDefined,
  IsNotEmpty,
  IsPhoneNumber,
  Matches,
} from 'class-validator';

/**
 * Data Transfer Object representing the parameters required to
 * update a user's profile.
 */
export class UpdateUserParametersDto {
  /**
   * The user's given first name.
   */
  @IsDefined({ message: i18nValidationMessage('user.first_name_required') })
  @IsNotEmpty({ message: i18nValidationMessage('user.first_name_cannot_be_empty') })
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/, {
    message: i18nValidationMessage('user.first_name_must_contain_only_letters'),
  })
  firstName: string;

  /**
   * The user's last name.
   */
  @IsDefined({ message: i18nValidationMessage('user.last_name_required') })
  @IsNotEmpty({ message: i18nValidationMessage('user.last_name_cannot_be_empty') })
  @Matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/, {
    message: i18nValidationMessage('user.last_name_must_contain_only_letters'),
  })
  lastName: string;

  /**
   * The user's phone number.
   */
  @IsDefined({ message: i18nValidationMessage('user.phone_required') })
  @IsNotEmpty({ message: i18nValidationMessage('user.phone_cannot_be_empty') })
  @IsPhoneNumber(undefined, { message: i18nValidationMessage('user.phone_must_be_valid') })
  phone: string;
}
