// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { IsDefined, IsString } from 'class-validator';

/**
 * Data Transfer Object representing the parameters required to
 * check whether a phone number is registered.
 */
export class IsPhoneRegisteredParametersDto {
  /**
   * The phone number to validate.
   */
  @IsDefined({ message: 'Phone number is required.' })
  @IsString({ message: 'Phone must be a string.' })
  phone: string;
}
